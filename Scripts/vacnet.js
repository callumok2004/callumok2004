// made by https://x.com/poggu__/
'use strict';

    // With any @grant set, Tampermonkey sandboxes us. Reach the page's real
    // window for the bits that must interact with the page's own globals
    // (its setInterval, its SetModeConfirmLabels/SubmitLabels).
    const W = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

    const SIDEBAR_WIDTH = '660px'; // default width; the dragged width is remembered per browser
    // NOTE: these must be declared before restoreSidebarWidth() is called below,
    // or the const TDZ throws inside its try/catch and the restore silently no-ops.
    const SIDEBAR_KEY = 'vacnetSidebarWidth';
    const SIDEBAR_MIN = 260;
    const SIDEBAR_MAX_MARGIN = 320; // always leave this much room for the video

    // ---- clamp gate ------------------------------------------------------
    // The page runs a setInterval that snaps the playhead back whenever it
    // leaves the clip window, which makes full-VOD scrubbing impossible. The
    // interval id is trapped in a closure, so instead we wrap setInterval
    // BEFORE the page's inline script runs (hence @run-at document-start) and
    // put its callback behind a flag we can flip. Everything else the page
    // schedules is passed through untouched.
    //
    // Firefox note: its sandbox is separated from page scope by Xray wrappers,
    // so a plain assignment of a sandbox function onto the page's window (or
    // handing one to a page-scope timer) is refused or silently inert. Anything
    // crossing that boundary has to go through exportFunction. If the override
    // can't be installed at all we simply leave the page's loop alone -- the
    // fallback looper below keeps replay working regardless.
    let clampEnabled = true;
    const nativeSetInterval = W.setInterval;

    // hand a sandbox function to page scope safely (no-op outside Firefox)
    function toPage(fn) {
        try {
            if (typeof exportFunction === 'function') return exportFunction(fn, W);
        } catch (e) { /* fall through */ }
        return fn;
    }

    function setIntervalWrapper(fn, delay) {
        let src = '';
        try { src = Function.prototype.toString.call(fn); } catch (e) { /* native/bound */ }
        if (typeof fn === 'function' && /endTime/.test(src) && /currentTime/.test(src)) {
            const original = fn;
            fn = toPage(function () {
                if (clampEnabled) return original.apply(this, arguments);
            });
        }
        return nativeSetInterval.apply(this, [fn, delay].concat([].slice.call(arguments, 2)));
    }

    let clampGateInstalled = false;
    try {
        W.setInterval = toPage(setIntervalWrapper);
        clampGateInstalled = true;
    } catch (e) {
        // Xray refused the assignment; the page keeps its own clamp
    }

    const css = `
        /* ---- nuke the junk ---- */
        .top-section,
        .top-section-logo,
        .top-section-text {
            display: none !important;
        }

        /* ---- page chrome ---- */
        html {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }

        /* header stays a normal header at the top; everything below fills the rest */
        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
        }

        .PageBackground {
            position: fixed !important;
            inset: 0 !important;
        }

        .PageHeader {
            flex: 0 0 auto !important;
            position: relative !important;
            z-index: 40 !important;
        }

        /* the footer's buttons get relocated into the verdict column (see moveFooterButtons) */
        .footer-container { display: none !important; }

        .verdict-column .footer-buttons {
            display: flex !important;
            gap: 14px !important;
            justify-content: center !important;
            margin: 12px 0 0 0 !important;
            padding-top: 10px !important;
            border-top: 1px solid rgba(255,255,255,0.15) !important;
            flex: 0 0 auto !important;
        }
        .verdict-column .footer-buttons a { font-size: 12px !important; }

        /* ---- layout: video left (fills everything), verdicts right ---- */
        .page-container {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            position: relative !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .flex-row-wrap {
            position: relative !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
        }

        .video-column {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            width: auto !important;
            max-width: none !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
        }

        .videocontainer {
            flex: 1 1 auto !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #000 !important;
        }

        /* video.js player fills the whole column, letterboxed */
        .video-js,
        #video,
        #video_html5_api,
        .videocontainer .vjs-tech {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
        }
        .video-js { padding-top: 0 !important; }
        .video-js .vjs-tech { object-fit: contain !important; }

        /* ---- decision table column ---- */
        :root { --vacnet-sidebar: ${SIDEBAR_WIDTH}; }

        .verdict-column,
        .verdict-column.size-for-column {
            flex: 0 0 var(--vacnet-sidebar) !important;
            width: var(--vacnet-sidebar) !important;
            max-width: var(--vacnet-sidebar) !important;
            min-width: var(--vacnet-sidebar) !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 8px 10px 10px 10px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            overflow-y: auto !important;
            background: rgba(0,0,0,0.65) !important;
            z-index: 30 !important;
        }

        /* The stock CSS takes these out of normal flow / pins them to a fixed
           height, which makes the submit button overlap whatever follows it once
           the column gets short. Force everything back into plain flow and let
           the column itself scroll. */
        .verdicts-container,
        .verdicts-container-inner {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            position: static !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            flex: 0 0 auto !important;
        }

        .verdict-block { margin-bottom: 12px !important; }
        .verdict-desc { font-size: 17px !important; line-height: 1.25 !important; }
        .verdictbuttons { margin-top: 6px !important; }
        .verdictbutton label { padding: 5px 8px !important; font-size: 16px !important; }
        .verdictbuttonslabel,
        .verdictbuttonsverdictlabel { font-size: 16px !important; }

        .submitbuttons {
            position: static !important;
            top: auto !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            width: 100% !important;
            height: auto !important;
            box-sizing: border-box !important;
            display: flex !important;
            gap: 10px !important;
            margin: 14px 0 0 0 !important;
            padding-top: 0 !important;
            flex: 0 0 auto !important;
        }
        .submitbuttons .submitverdictbutton { flex: 1 1 auto !important; }
        .submitbuttons .backbutton { flex: 0 0 auto !important; }

        /* status text sits under the buttons rather than over them */
        .status-text-container {
            position: static !important;
            width: 100% !important;
        }

        /* ---- sidebar resize handle ---- */
        .sidebar-resizer {
            position: absolute !important;
            top: 0 !important;
            bottom: 0 !important;
            right: var(--vacnet-sidebar) !important;
            width: 5px !important;
            margin-right: -2px !important;
            cursor: col-resize !important;
            background: rgba(255,255,255,0.12) !important;
            z-index: 35 !important;
            touch-action: none !important;
        }
        .sidebar-resizer:hover,
        .sidebar-resizer.dragging { background: #f5a623 !important; }
        /* wider invisible grab area than the visible line */
        .sidebar-resizer::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important; bottom: 0 !important;
            left: -4px !important; right: -4px !important;
        }
        body.sidebar-resizing { user-select: none !important; cursor: col-resize !important; }

        /* ---- press-and-hold 2x badge ---- */
        .holdspeed-badge {
            position: absolute !important;
            top: 24px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            padding: 6px 14px !important;
            border-radius: 16px !important;
            background: rgba(0,0,0,0.75) !important;
            color: #fff !important;
            font-size: 14px !important;
            font-weight: bold !important;
            font-family: sans-serif !important;
            letter-spacing: 1px !important;
            pointer-events: none !important;
            opacity: 0 !important;
            transition: opacity 0.1s ease !important;
            z-index: 5 !important;
        }
        .holdspeed-badge.visible { opacity: 1 !important; }

        /* ---- previously reviewed segments, on the FULL bar ---- */
        .clipbar-marks {
            position: absolute !important;
            left: 0 !important; right: 0 !important;
            top: -3px !important; bottom: -3px !important;
            pointer-events: none !important;
            z-index: 0 !important;
        }
        .clipbar-mark {
            position: absolute !important;
            top: 0 !important; bottom: 0 !important;
            border-radius: 2px !important;
            opacity: 0.85 !important;
            pointer-events: auto !important;
        }
        .clipbar-mark.seen-guilty    { background: #b03030 !important; }
        .clipbar-mark.seen-clean     { background: #3d8b40 !important; }
        .clipbar-mark.seen-uncertain { background: #8a8a8a !important; }
        .clipbar-mark.seen-bad       { background: #7a4fb5 !important; }

        /* ---- history panel ---- */
        .cliphistory {
            margin-top: 14px !important;
            padding-top: 12px !important;
            border-top: 1px solid rgba(255,255,255,0.15) !important;
            flex: 0 0 auto !important;
            font-size: 13px !important;
        }
        .cliphistory-head {
            font-size: 13px !important;
            font-weight: bold !important;
            color: #f5a623 !important;
            margin-bottom: 6px !important;
        }
        .cliphistory-row {
            display: flex !important;
            align-items: baseline !important;
            gap: 10px !important;
            padding: 3px 0 !important;
            border-bottom: 1px solid rgba(255,255,255,0.07) !important;
        }
        .cliphistory-verdict { flex: 0 0 auto !important; font-weight: bold !important; }
        .cliphistory-verdict.seen-guilty    { color: #ff6b6b !important; }
        .cliphistory-verdict.seen-clean     { color: #6bd47a !important; }
        .cliphistory-verdict.seen-uncertain { color: #b8b8b8 !important; }
        .cliphistory-verdict.seen-bad       { color: #c39bf0 !important; }
        .cliphistory-seg {
            flex: 1 1 auto !important;
            font-family: monospace !important;
            color: rgba(255,255,255,0.75) !important;
        }
        .cliphistory-meta {
            flex: 0 0 auto !important;
            font-size: 11px !important;
            color: rgba(255,255,255,0.5) !important;
        }

        /* ---- already-reviewed slices, painted over the current-clip band ---- */
        .clipbar-overlaps {
            position: absolute !important;
            left: 0 !important; right: 0 !important;
            top: -2px !important; bottom: -2px !important;
            pointer-events: none !important;
            z-index: 2 !important; /* above .clipbar-region, so it splits the orange */
        }
        .clipbar-overlap {
            position: absolute !important;
            top: 0 !important; bottom: 0 !important;
            border-radius: 2px !important;
            pointer-events: auto !important;
            /* hatched so it reads as "seen before" rather than as plain fill */
            background-image: repeating-linear-gradient(
                45deg,
                rgba(255,255,255,0.35) 0 3px,
                rgba(255,255,255,0) 3px 6px
            ) !important;
        }
        .clipbar-overlap.seen-guilty    { background-color: #b03030 !important; }
        .clipbar-overlap.seen-clean     { background-color: #3d8b40 !important; }
        .clipbar-overlap.seen-uncertain { background-color: #8a8a8a !important; }
        .clipbar-overlap.seen-bad       { background-color: #7a4fb5 !important; }

        /* ---- VOD alias header ---- */
        .vodname {
            flex: 0 0 auto !important;
            display: flex !important;
            align-items: baseline !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            margin-bottom: 12px !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid rgba(255,255,255,0.15) !important;
        }
        .vodname-label {
            font-size: 11px !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            color: rgba(255,255,255,0.45) !important;
        }
        .vodname-name {
            font-size: 19px !important;
            font-weight: bold !important;
            color: #fff !important;
        }
        .vodname-id {
            font-family: monospace !important;
            font-size: 11px !important;
            color: rgba(255,255,255,0.35) !important;
        }
        .vodname-seen {
            font-size: 11px !important;
            font-weight: bold !important;
            color: #f5a623 !important;
            border: 1px solid rgba(245,166,35,0.5) !important;
            border-radius: 10px !important;
            padding: 1px 8px !important;
        }

        /* ---- overlap warning banner ---- */
        .overlapwarn {
            flex: 0 0 auto !important;
            margin-bottom: 12px !important;
            padding: 8px 10px !important;
            background: rgba(245,166,35,0.12) !important;
            border: 1px solid rgba(245,166,35,0.5) !important;
            border-radius: 3px !important;
        }
        .overlapwarn-head {
            font-size: 14px !important;
            font-weight: bold !important;
            color: #f5a623 !important;
            margin-bottom: 5px !important;
        }
        .overlapwarn-row {
            display: flex !important;
            align-items: baseline !important;
            gap: 10px !important;
            padding: 2px 0 !important;
            font-size: 13px !important;
        }
        .overlapwarn-row a { color: #7ec2ff !important; }
        .overlapwarn-share {
            flex: 1 1 auto !important;
            font-family: monospace !important;
            color: rgba(255,255,255,0.8) !important;
        }

        /* ---- history popup ---- */
        .histbutton {
            width: 100% !important;
            margin-top: 8px !important;
            padding: 7px 6px !important;
            font-size: 13px !important;
            color: #fff !important;
            background: rgba(255,255,255,0.10) !important;
            border: 1px solid rgba(255,255,255,0.25) !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            flex: 0 0 auto !important;
        }
        .histbutton:hover { background: rgba(255,255,255,0.18) !important; }

        .sharebutton {
            width: 100% !important;
            margin-top: 8px !important;
            padding: 7px 6px !important;
            font-size: 13px !important;
            color: #fff !important;
            background: rgba(255,255,255,0.10) !important;
            border: 1px solid rgba(255,255,255,0.25) !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            flex: 0 0 auto !important;
        }
        .sharebutton:hover { background: rgba(255,255,255,0.18) !important; }
        .sharebutton.copied {
            background: #3d8b40 !important;
            border-color: #3d8b40 !important;
        }

        .histpopup-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(0,0,0,0.6) !important;
            z-index: 200 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .histpopup {
            width: min(760px, 92vw) !important;
            max-height: 82vh !important;
            display: flex !important;
            flex-direction: column !important;
            background: #1b1f23 !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            border-radius: 5px !important;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6) !important;
        }
        .histpopup-head {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 10px 14px !important;
            font-size: 14px !important;
            font-weight: bold !important;
            color: #fff !important;
            border-bottom: 1px solid rgba(255,255,255,0.15) !important;
        }
        .histpopup-close { cursor: pointer !important; padding: 0 6px !important; }
        .histpopup-body { overflow-y: auto !important; padding: 10px 14px 14px 14px !important; }
        .histpopup-empty { color: rgba(255,255,255,0.6) !important; padding: 20px 0 !important; }

        /* one block per source VOD, so repeats read as a group */
        .histgroup {
            margin-bottom: 12px !important;
            padding: 6px 0 6px 10px !important;
            border-left: 3px solid rgba(255,255,255,0.25) !important;
            background: rgba(255,255,255,0.03) !important;
        }
        .histgroup.is-current { border-left-color: #f5a623 !important; background: rgba(245,166,35,0.08) !important; }
        .histgroup-head {
            display: flex !important;
            align-items: baseline !important;
            gap: 10px !important;
            margin-bottom: 4px !important;
        }
        .histgroup-id {
            font-family: monospace !important;
            font-size: 12px !important;
            color: rgba(255,255,255,0.65) !important;
        }
        .histgroup-count {
            font-size: 12px !important;
            font-weight: bold !important;
            color: #fff !important;
        }
        .histgroup-now {
            font-size: 11px !important;
            color: #f5a623 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
        }
        .histrow {
            display: flex !important;
            align-items: baseline !important;
            gap: 10px !important;
            padding: 3px 0 !important;
            font-size: 13px !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }
        .histrow a { color: #7ec2ff !important; }
        .histrow-notask { color: rgba(255,255,255,0.4) !important; }

        /* ---- one-click verdict presets ---- */
        .presetbuttons {
            display: flex !important;
            gap: 10px !important;
            margin-top: 14px !important;
            padding-top: 12px !important;
            border-top: 1px solid rgba(255,255,255,0.15) !important;
            flex: 0 0 auto !important;
        }
        .presetbutton {
            flex: 1 1 0 !important;
            padding: 9px 6px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            color: #fff !important;
            border: none !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            opacity: 0.85 !important;
            transition: opacity 0.1s ease !important;
        }
        .presetbutton:hover { opacity: 1 !important; }
        .downloadrow {
            display: flex !important;
            gap: 8px !important;
            margin-top: 10px !important;
            flex: 0 0 auto !important;
        }
        .downloadformat {
            flex: 0 0 auto !important;
            padding: 0 6px !important;
            font-size: 13px !important;
            color: #fff !important;
            background: rgba(255,255,255,0.14) !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
            border-radius: 3px !important;
            cursor: pointer !important;
        }
        .downloadformat option { color: #000 !important; }

        .downloadclip {
            flex: 1 1 auto !important;
            width: auto !important;
            padding: 8px 6px !important;
            font-size: 14px !important;
            color: #fff !important;
            background: rgba(255,255,255,0.14) !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            flex: 0 0 auto !important;
        }
        .downloadclip:hover { background: rgba(255,255,255,0.22) !important; }
        .downloadclip:disabled { cursor: default !important; }
        .downloadclip.recording {
            background: #b03030 !important;
            border-color: #b03030 !important;
            font-family: monospace !important;
        }

        .preset-legit { background: #3d8b40 !important; }
        .preset-wh    { background: #d3841a !important; }
        .preset-hvh   { background: #b03030 !important; }

        /* keep the modal usable on top of everything */
        .modaloverlay { z-index: 100 !important; }

        /* ---- clip-scoped scrub bar replaces video.js's full-length one ---- */
        .vjs-control-bar .vjs-progress-control,
        .vjs-control-bar .vjs-current-time,
        .vjs-control-bar .vjs-time-divider,
        .vjs-control-bar .vjs-duration,
        .vjs-control-bar .vjs-remaining-time {
            display: none !important;
        }

        .clipbar {
            display: flex !important;
            align-items: center !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
            height: 100% !important;
            padding: 0 12px !important;
        }
        .clipbar-track {
            flex: 1 1 auto !important;
            position: relative !important;
            height: 6px !important;
            border-radius: 3px !important;
            background: rgba(255,255,255,0.28) !important;
            cursor: pointer !important;
            touch-action: none !important;
        }
        /* fat invisible hit area so you don't have to pixel-hunt the 6px bar */
        .clipbar-track::before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important; right: 0 !important;
            top: -9px !important; bottom: -9px !important;
        }
        /* stacking order within a track, bottom to top:
           marks(0) < region(1) < overlaps(2) < fill(3) < event(4) < handle(5) */
        .clipbar-fill {
            position: absolute !important;
            left: 0 !important; top: 0 !important; bottom: 0 !important;
            width: 0 !important;
            border-radius: 3px !important;
            background: #fff !important;
            pointer-events: none !important;
            z-index: 3 !important;
        }
        .clipbar-handle {
            position: absolute !important;
            top: 50% !important;
            width: 13px !important;
            height: 13px !important;
            margin: -6.5px 0 0 -6.5px !important;
            border-radius: 50% !important;
            background: #fff !important;
            pointer-events: none !important;
            z-index: 5 !important;
        }
        .clipbar-time {
            margin-left: 10px !important;
            font-size: 12px !important;
            font-family: monospace !important;
            color: #fff !important;
            /* pre, not nowrap: the padding space we prepend must survive */
            white-space: pre !important;
            /* fixed width + tabular figures: otherwise 9.9s -> 10.0s widens the
               label, shrinks the track, and the playhead visibly jumps back */
            flex: 0 0 14ch !important;
            min-width: 14ch !important;
            text-align: right !important;
            font-variant-numeric: tabular-nums !important;
        }
        .clipbar-label {
            flex: 0 0 auto !important;
            margin-right: 10px !important;
            font-size: 10px !important;
            font-family: monospace !important;
            letter-spacing: 1px !important;
            color: rgba(255,255,255,0.55) !important;
        }

        /* full-VOD bar: its own row sitting directly on top of the control bar.
           Keep it UNDER the control bar in stacking order -- the playback-rate /
           subtitles menus pop upward out of the control bar and would otherwise
           open behind this row. */
        .video-js .clipbar-full {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 3em !important;
            height: 26px !important;
            background: rgba(0,0,0,0.55) !important;
            z-index: 1 !important;
            transition: opacity 0.1s ease !important;
        }
        .video-js .vjs-control-bar { z-index: 6 !important; }
        .video-js .vjs-menu,
        .video-js .vjs-menu-content { z-index: 7 !important; }
        /* Leave the menu at video.js's default offset: it overlaps the control
           bar, so the mouse never has to cross the FULL row (which would drop
           the hover and close the menu). It paints over the FULL row instead. */
        /* fade out with the control bar when the player auto-hides its chrome */
        .video-js.vjs-user-inactive.vjs-playing .clipbar-full {
            opacity: 0 !important;
            pointer-events: none !important;
        }
        /* extra belt-and-braces: while a menu is open the FULL row can't intercept
           the pointer at all (harmless no-op on browsers without :has) */
        .video-js:has(.vjs-menu-button-popup:hover) .clipbar-full { pointer-events: none !important; }
        .video-js:has(.vjs-lock-showing) .clipbar-full { pointer-events: none !important; }

        .clipbar-full .clipbar-track { height: 4px !important; }
        .clipbar-full .clipbar-fill { background: rgba(255,255,255,0.8) !important; }
        .clipbar-full .clipbar-handle { width: 11px !important; height: 11px !important; margin: -5.5px 0 0 -5.5px !important; }

        /* the moment the detection fired, marked on the CLIP bar */
        .clipbar-event {
            position: absolute !important;
            top: -4px !important;
            bottom: -4px !important;
            width: 3px !important;
            margin-left: -1.5px !important;
            border-radius: 1px !important;
            background: #4dd2ff !important;
            box-shadow: 0 0 4px rgba(77,210,255,0.9) !important;
            pointer-events: none !important;
            z-index: 4 !important;
        }

        /* marks where the ~12s clip sits inside the full VOD */
        .clipbar-region {
            position: absolute !important;
            top: -2px !important;
            bottom: -2px !important;
            background: #f5a623 !important;
            border-radius: 2px !important;
            pointer-events: none !important;
            z-index: 1 !important;
        }

        .clipbar-rearm {
            flex: 0 0 auto !important;
            margin-left: 10px !important;
            padding: 2px 8px !important;
            font-size: 11px !important;
            font-family: monospace !important;
            color: #fff !important;
            background: rgba(255,255,255,0.12) !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
            border-radius: 3px !important;
            cursor: pointer !important;
            visibility: hidden !important;
        }
        /* only offered once you've actually left the clip */
        .clipbar-unclamped .clipbar-rearm { visibility: visible !important; }
        .clipbar-unclamped .clipbar-label { color: #f5a623 !important; }
    `;

    function inject() {
        const style = document.createElement('style');
        style.id = 'vacnet-bigplayer-style';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }
    inject();
    restoreSidebarWidth();

    // video.js sets inline width/height from the <video> attributes; strip them
    // and re-strip whenever the player re-renders.
    function unsizePlayer() {
        document.querySelectorAll('.video-js, #video, video').forEach(el => {
            el.style.removeProperty('width');
            el.style.removeProperty('height');
            el.removeAttribute('width');
            el.removeAttribute('height');
        });
    }

    function killJunk() {
        document.querySelectorAll('.top-section, .top-section-logo').forEach(el => el.remove());
    }

    // Buttons read "Label Aim Assist" / "Label Not Aim Assist" -- drop the leading
    // "Label" text node, leaving "Aim Assist" / "Not Aim Assist".
    //   is the &nbsp; the page uses between "Label" and the rest.
    function stripLabelPrefix() {
        const sel = '.verdictbutton label, .verdictbuttonsverdictlabel';
        document.querySelectorAll(sel).forEach(el => {
            const first = el.firstChild;
            if (!first || first.nodeType !== Node.TEXT_NODE) return;
            const stripped = first.nodeValue.replace(/^\s*Label[\s ]*/, '');
            if (stripped !== first.nodeValue) first.nodeValue = stripped;
        });
    }

    // ---- clip-scoped scrub bar -------------------------------------------
    // The server ships the whole match VOD and the page clamps playback to a
    // ~12s window inside it, but the clip bounds live in a closure so video.js
    // still scrubs the full length. Scrape the bounds out of the page's inline
    // script and drive our own bar off them. We always write ABSOLUTE times to
    // the <video>, so the page's own clamp/loop interval keeps working.
    let clip = null;
    let clipLookedUp = false;

    function getClipBounds() {
        if (clipLookedUp) return clip;
        for (const s of document.querySelectorAll('script')) {
            const t = s.textContent;
            if (!t || t.indexOf('startTime') === -1) continue;
            const a = t.match(/const\s+startTime\s*=\s*([0-9.]+)\s*;/);
            const b = t.match(/const\s+endTime\s*=\s*startTime\s*\+\s*([0-9.]+)\s*;/);
            const c = t.match(/const\s+eventTime\s*=\s*([0-9.]+)\s*;/);
            if (a && b) {
                clip = { start: parseFloat(a[1]), len: parseFloat(b[1]) };
                // the moment the detection actually fired -- the page reads it
                // into a variable and then never surfaces it anywhere
                if (c) clip.event = parseFloat(c[1]);
                break;
            }
        }
        clipLookedUp = true;
        return clip;
    }

    function fmt(t, total) {
        if (!isFinite(t)) return '--';
        if (total < 90) return t.toFixed(1) + 's';
        const m = Math.floor(t / 60);
        const s = t - m * 60;
        return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
    }

    // Generic scrub bar. `getStart`/`getLen` define the window it spans, so the
    // same widget drives both the clip-only bar and the whole-VOD bar.
    function makeBar(videoEl, opts) {
        const bar = document.createElement('div');
        bar.className = 'clipbar ' + opts.cls;
        bar.innerHTML =
            '<div class="clipbar-label">' + opts.label + '</div>' +
            '<div class="clipbar-track">' +
            (opts.marks ? '<div class="clipbar-marks"></div>' : '') +
            (opts.showRegion ? '<div class="clipbar-region"></div>' : '') +
            (opts.overlaps ? '<div class="clipbar-overlaps"></div>' : '') +
            (opts.showEvent ? '<div class="clipbar-event" title="Detection event"></div>' : '') +
            '<div class="clipbar-fill"></div>' +
            '<div class="clipbar-handle"></div>' +
            '</div>' +
            '<div class="clipbar-time"></div>';

        const track = bar.querySelector('.clipbar-track');
        const region = bar.querySelector('.clipbar-region');
        const eventMark = bar.querySelector('.clipbar-event');
        const marksBox = bar.querySelector('.clipbar-marks');
        const lapsBox = bar.querySelector('.clipbar-overlaps');
        const fill = bar.querySelector('.clipbar-fill');
        const handle = bar.querySelector('.clipbar-handle');
        const time = bar.querySelector('.clipbar-time');

        let dragging = false;
        let wasPlaying = false;

        function seekFromEvent(e) {
            const len = opts.getLen();
            if (!(len > 0)) return;
            const r = track.getBoundingClientRect();
            let frac = (e.clientX - r.left) / r.width;
            frac = Math.min(Math.max(frac, 0), 1);
            opts.onSeek(opts.getStart() + frac * len, len);
            render();
        }

        track.addEventListener('pointerdown', e => {
            dragging = true;
            wasPlaying = !videoEl.paused;
            videoEl.pause();
            track.setPointerCapture(e.pointerId);
            seekFromEvent(e);
            e.preventDefault();
        });
        track.addEventListener('pointermove', e => {
            if (dragging) seekFromEvent(e);
        });
        track.addEventListener('pointerup', e => {
            if (!dragging) return;
            dragging = false;
            try { track.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
            if (wasPlaying) videoEl.play();
        });

        function render() {
            const start = opts.getStart();
            const len = opts.getLen();
            if (!(len > 0)) return;
            const rel = Math.min(Math.max(videoEl.currentTime - start, 0), len);
            const pct = (rel / len) * 100;
            fill.style.setProperty('width', pct + '%', 'important');
            handle.style.setProperty('left', pct + '%', 'important');
            // pad the elapsed half to the width of the total ("9.9s" -> " 9.9s")
            // so the string length never changes as the count crosses 10
            const total = fmt(len, len);
            time.textContent = fmt(rel, len).padStart(total.length, ' ') + ' / ' + total;
            if (marksBox && opts.marks) {
                const list = opts.marks();
                // rebuild only when the set (or the duration it maps onto) changes
                const sig = len + '|' + list.map(m => m.start + ':' + m.len + ':' + m.cls).join(',');
                if (marksBox.dataset.sig !== sig) {
                    marksBox.dataset.sig = sig;
                    marksBox.innerHTML = list.map(m =>
                        '<div class="clipbar-mark ' + m.cls + '" title="' + esc(m.title) + '" ' +
                        'style="left:' + ((m.start - start) / len) * 100 + '%;' +
                        'width:max(2px,' + (m.len / len) * 100 + '%)"></div>'
                    ).join('');
                }
            }
            if (lapsBox && opts.overlaps) {
                const laps = opts.overlaps();
                const sig = start + '|' + len + '|' +
                    laps.map(o => o.start + ':' + o.len + ':' + o.cls).join(',');
                if (lapsBox.dataset.sig !== sig) {
                    lapsBox.dataset.sig = sig;
                    lapsBox.innerHTML = laps.map(o =>
                        '<div class="clipbar-overlap ' + o.cls + '" ' +
                        'title="' + esc('already reviewed: ' + o.verdict + ' · ' + ago(o.ts)) + '" ' +
                        'style="left:' + ((o.start - start) / len) * 100 + '%;' +
                        'width:max(2px,' + (o.len / len) * 100 + '%)"></div>'
                    ).join('');
                }
            }
            if (eventMark && opts.event) {
                const rel = opts.event() - start;
                if (rel >= 0 && rel <= len) {
                    eventMark.style.setProperty('left', (rel / len) * 100 + '%', 'important');
                    eventMark.style.setProperty('display', 'block', 'important');
                } else {
                    eventMark.style.setProperty('display', 'none', 'important');
                }
            }
            if (region && opts.region) {
                const r = opts.region();
                region.style.setProperty('left', (r.start / len) * 100 + '%', 'important');
                // always at least a sliver wide -- 12s inside a 40min VOD is sub-pixel
                region.style.setProperty('width', 'max(2px, ' + (r.len / len) * 100 + '%)', 'important');
            }
        }

        bar.render = render;
        bar.isDragging = () => dragging;
        return bar;
    }

    function buildBars(videoEl, controlBar, bounds) {
        // Clip bar: lives in the control bar, spans only the clip. Seeking here
        // re-arms the page's clamp so normal looped review behaviour comes back.
        const clipBar = makeBar(videoEl, {
            cls: 'clipbar-clip',
            label: 'CLIP',
            getStart: () => bounds.start,
            getLen: () => bounds.len,
            showEvent: bounds.event != null,
            event: () => bounds.event,
            // slices of this clip you've already judged on an earlier task
            overlaps: overlapSegments,
            onSeek: (t, len) => {
                clampEnabled = true;
                // stop a hair short of the end so the clamp doesn't instantly restart us
                videoEl.currentTime = Math.min(t, bounds.start + len - 0.05);
            }
        });
        controlBar.insertBefore(clipBar, controlBar.querySelector('.vjs-progress-control'));

        // Full bar: its own row above the control bar, spans the entire VOD.
        // Touching it disables the clamp, otherwise we'd be yanked back in <100ms.
        const fullBar = makeBar(videoEl, {
            cls: 'clipbar-full',
            label: 'FULL',
            showRegion: true,
            getStart: () => 0,
            getLen: () => (isFinite(videoEl.duration) ? videoEl.duration : 0),
            region: () => bounds,
            // the part of the orange current-clip band you've already reviewed,
            // painted in the old verdict's colour so the band reads as split
            overlaps: overlapSegments,
            // segments of this VOD reviewed on previous tasks
            marks: () => seenEntries().map(e => {
                const s = summarize(e.code);
                return {
                    start: e.start,
                    len: e.len,
                    cls: s.cls,
                    title: s.text + ' · ' + e.start.toFixed(1) + 's → ' +
                        (e.start + e.len).toFixed(1) + 's · ' + ago(e.ts)
                };
            }),
            onSeek: t => {
                clampEnabled = false;
                videoEl.currentTime = t;
            }
        });
        const rearm = document.createElement('button');
        rearm.className = 'clipbar-rearm';
        rearm.type = 'button';
        rearm.textContent = '↺ clip';
        rearm.title = 'Jump back to the clip and re-enable clip looping';
        rearm.addEventListener('click', () => {
            clampEnabled = true;
            videoEl.currentTime = bounds.start;
            videoEl.play();
        });
        fullBar.appendChild(rearm);
        controlBar.parentElement.insertBefore(fullBar, controlBar);

        (function loop() {
            if (!clipBar.isConnected) return;
            if (!clipBar.isDragging()) clipBar.render();
            if (!fullBar.isDragging()) fullBar.render();
            fullBar.classList.toggle('clipbar-unclamped', !clampEnabled);
            requestAnimationFrame(loop);
        })();
    }

    function ensureClipBar() {
        const controlBar = document.querySelector('.video-js .vjs-control-bar');
        if (!controlBar || controlBar.querySelector('.clipbar')) return;
        const videoEl = document.querySelector('.video-js video');
        const bounds = getClipBounds();
        if (!videoEl || !bounds || !(bounds.len > 0)) return; // no bounds -> leave stock player alone
        buildBars(videoEl, controlBar, bounds);
    }

    // ---- draggable sidebar edge ------------------------------------------
    function setSidebarWidth(px, persist) {
        const max = Math.max(SIDEBAR_MIN, window.innerWidth - SIDEBAR_MAX_MARGIN);
        const w = Math.round(Math.min(Math.max(px, SIDEBAR_MIN), max));
        document.documentElement.style.setProperty('--vacnet-sidebar', w + 'px');
        if (persist) {
            try { localStorage.setItem(SIDEBAR_KEY, String(w)); } catch (e) { /* storage blocked */ }
        }
        return w;
    }

    function currentSidebarWidth() {
        const v = getComputedStyle(document.documentElement).getPropertyValue('--vacnet-sidebar');
        return parseFloat(v);
    }

    function restoreSidebarWidth() {
        let saved = null;
        try { saved = localStorage.getItem(SIDEBAR_KEY); } catch (e) { /* storage blocked */ }
        if (saved && parseFloat(saved) > 0) setSidebarWidth(parseFloat(saved), false);
    }

    // The page reloads on every submit, so make sure the current width is on
    // disk even if a drag never got a clean pointerup (navigation mid-drag, or
    // a dropped pointer event).
    window.addEventListener('pagehide', () => {
        const w = currentSidebarWidth();
        if (w > 0) {
            try { localStorage.setItem(SIDEBAR_KEY, String(Math.round(w))); } catch (e) { /* storage blocked */ }
        }
    });

    function ensureResizer() {
        const row = document.querySelector('.flex-row-wrap');
        if (!row || row.querySelector('.sidebar-resizer')) return;
        const grip = document.createElement('div');
        grip.className = 'sidebar-resizer';
        grip.title = 'Drag to resize · double-click to reset';

        let dragging = false;

        grip.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            dragging = true;
            grip.setPointerCapture(e.pointerId);
            grip.classList.add('dragging');
            document.body.classList.add('sidebar-resizing');
            e.preventDefault();
        });
        grip.addEventListener('pointermove', e => {
            if (!dragging) return;
            setSidebarWidth(window.innerWidth - e.clientX, false);
        });
        function end(e) {
            if (!dragging) return;
            dragging = false;
            try { grip.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
            grip.classList.remove('dragging');
            document.body.classList.remove('sidebar-resizing');
            setSidebarWidth(currentSidebarWidth(), true);
        }
        grip.addEventListener('pointerup', end);
        grip.addEventListener('pointercancel', end);
        grip.addEventListener('dblclick', () => setSidebarWidth(parseFloat(SIDEBAR_WIDTH), true));

        row.appendChild(grip);
    }

    // keep the sidebar within bounds if the window shrinks under it
    window.addEventListener('resize', () => {
        const w = currentSidebarWidth();
        if (w > 0) setSidebarWidth(w, false);
    });

    // ---- replay safety net -----------------------------------------------
    // The page's own loop restarts the clip at its end. On Firefox our wrapped
    // callback may never be invoked across the Xray boundary, which leaves the
    // clip sitting dead at the end instead of replaying. Run an equivalent loop
    // ourselves: idempotent with the page's, so it costs nothing where the
    // page's own loop is working.
    function ensureClipLoop() {
        if (document.documentElement.dataset.vacnetLoop) return;
        if (!pageVideoEl() || !getClipBounds()) return;
        document.documentElement.dataset.vacnetLoop = '1';

        let restarting = false;
        // NB: the sandbox's own setInterval, not the page's. Calling the page's
        // detached from window throws "Illegal invocation" on Chrome, and on
        // Firefox it would hand a sandbox callback across the Xray boundary --
        // the exact failure this net exists to cover for.
        setInterval(() => {
            if (!clampEnabled) return; // FULL-bar scrubbing: let it roam
            const v = pageVideoEl();
            const b = getClipBounds();
            if (!v || !b || restarting) return;
            if (v.seeking) return;

            const end = b.start + b.len;
            if (v.currentTime >= end || v.ended) {
                restarting = true;
                v.currentTime = b.start;
                const p = v.play();
                if (p && p.catch) p.catch(() => { /* autoplay refused */ });
                setTimeout(() => { restarting = false; }, 300);
            } else if (v.currentTime < b.start - 1 / 60) {
                v.currentTime = b.start;
            }
        }, 120);
    }

    // ---- keyboard scrubbing ----------------------------------------------
    const FRAME = 1 / 60;          // no frame-rate metadata in HTML video; 60fps assumed
    const ARROW_STEP = 1;          // seconds per arrow press
    const HOLD_SCRUB_RATE = 0.5;   // held , / . advances at half real time
    const HOLD_SCRUB_DELAY = 300;  // ms before a held key turns into a scrub

    function pageVideoEl() {
        return document.querySelector('.video-js video');
    }

    // seek in absolute time, kept inside the clip while the clamp is armed
    function seekAbsolute(t) {
        const v = pageVideoEl();
        if (!v) return;
        const b = getClipBounds();
        if (b && clampEnabled) {
            t = Math.min(Math.max(t, b.start), b.start + b.len - 0.05);
        }
        v.currentTime = t;
    }

    function seekBy(dt) {
        const v = pageVideoEl();
        if (v) seekAbsolute(v.currentTime + dt);
    }

    function isTypingTarget(el) {
        if (!el) return false;
        if (el.isContentEditable) return true;
        const tag = el.tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
        // radios/checkboxes are fine to steal arrows from; text fields are not
        return tag === 'INPUT' && !/^(radio|checkbox|button|submit)$/i.test(el.type);
    }

    function ensureKeys() {
        if (document.documentElement.dataset.vacnetKeys) return;
        document.documentElement.dataset.vacnetKeys = '1';

        let holdKey = null;
        let holdTimer = null;
        let reverseTimer = null;
        let scrubRate = null; // playbackRate to restore after a forward scrub

        function stopScrub() {
            clearTimeout(holdTimer);
            holdTimer = null;
            if (reverseTimer) {
                clearInterval(reverseTimer);
                reverseTimer = null;
            }
            const v = pageVideoEl();
            if (v && scrubRate !== null) {
                v.pause();
                v.playbackRate = scrubRate;
                scrubRate = null;
            }
            holdKey = null;
        }

        // Forward: actually play at 0.5x. Seeking repeatedly would re-buffer on
        // every seek; letting the decoder run is the only way to get smooth
        // motion. Reverse has no such luxury -- video can't play backwards -- so
        // we step with seeks, but at ~20/s and never while a seek is in flight,
        // which keeps the decoder from thrashing.
        const REVERSE_INTERVAL = 50; // ms between reverse seeks

        function startScrub(dir) {
            const v = pageVideoEl();
            if (!v) return;

            if (dir > 0) {
                scrubRate = v.playbackRate;
                v.playbackRate = HOLD_SCRUB_RATE;
                v.play();
                return;
            }

            reverseTimer = setInterval(() => {
                if (holdKey !== ',') return;
                if (v.seeking) return; // let the previous seek land first
                seekBy(-HOLD_SCRUB_RATE * (REVERSE_INTERVAL / 1000));
            }, REVERSE_INTERVAL);
        }

        document.addEventListener('keydown', e => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (isTypingTarget(e.target)) return;
            const v = pageVideoEl();
            if (!v) return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // preventDefault also stops arrows from moving the radio selection
                e.preventDefault();
                seekBy(e.key === 'ArrowLeft' ? -ARROW_STEP : ARROW_STEP);
                return;
            }

            if (e.key === ',' || e.key === '.') {
                e.preventDefault();
                if (e.repeat || holdKey) return; // our own loop drives the hold
                holdKey = e.key;
                const dir = e.key === ',' ? -1 : 1;
                v.pause();
                seekBy(dir * FRAME); // tap = exactly one frame
                holdTimer = setTimeout(() => startScrub(dir), HOLD_SCRUB_DELAY);
            }
        }, true);

        document.addEventListener('keyup', e => {
            if (e.key === holdKey) stopScrub();
        });
        window.addEventListener('blur', stopScrub);
    }

    // ---- scroll-to-seek ---------------------------------------------------
    // Wheel over the player scrubs: up = forward, down = back. Bound to the
    // player element only, so the sidebar keeps its normal scrolling.
    const WHEEL_STEP = 0.25;      // seconds per notch
    const WHEEL_STEP_FINE = 1 / 60; // with shift held: one frame per notch
    const WHEEL_RESUME_DELAY = 500; // ms of quiet before rewinding resumes play

    function ensureWheelSeek() {
        const player = document.querySelector('.video-js');
        if (!player || player.dataset.wheelSeek) return;
        player.dataset.wheelSeek = '1';

        // Rewinding while playing fights itself -- playback keeps pushing the
        // playhead forward between notches. Pause for the duration of the
        // gesture and resume shortly after the last one. Only ever resumes
        // playback that the wheel itself interrupted.
        let resumeTimer = null;
        let pausedByWheel = false;

        function resumeNow(v) {
            clearTimeout(resumeTimer);
            resumeTimer = null;
            if (!pausedByWheel) return;
            pausedByWheel = false;
            const p = v.play();
            if (p && p.catch) p.catch(() => { /* autoplay refused */ });
        }

        player.addEventListener('wheel', e => {
            // let the controls and our own bars keep any wheel behaviour
            if (e.target.closest && e.target.closest('.vjs-menu, .vjs-menu-content')) return;
            const v = pageVideoEl();
            if (!v) return;

            e.preventDefault();  // no page scroll while seeking
            e.stopPropagation();

            // deltaY is negative when scrolling up
            const dir = e.deltaY < 0 ? 1 : -1;
            const stepSize = e.shiftKey ? WHEEL_STEP_FINE : WHEEL_STEP;

            // rewinding starts the hold
            if (dir < 0 && !v.paused) {
                v.pause();
                pausedByWheel = true;
            }
            // once held, ANY further notch (either direction) pushes the resume
            // back, so scrubbing back and forth never stutters into playback
            if (pausedByWheel) {
                clearTimeout(resumeTimer);
                resumeTimer = setTimeout(() => resumeNow(v), WHEEL_RESUME_DELAY);
            }

            seekBy(dir * stepSize);
        }, { passive: false });
    }

    // ---- press-and-hold for 2x (YouTube style) ---------------------------
    const HOLD_SPEED = 2;
    const HOLD_DELAY = 250; // ms before a press counts as a hold, so plain clicks still toggle play

    function ensureHoldSpeed() {
        const player = document.querySelector('.video-js');
        const videoEl = document.querySelector('.video-js video');
        if (!player || !videoEl || player.dataset.holdSpeed) return;
        player.dataset.holdSpeed = '1';

        const badge = document.createElement('div');
        badge.className = 'holdspeed-badge';
        badge.textContent = HOLD_SPEED + 'x  ▶▶';
        player.appendChild(badge);

        let timer = null;
        let active = false;
        let suppressClick = false;
        let prevRate = 1;
        let wasPaused = false;

        function start() {
            active = true;
            prevRate = videoEl.playbackRate;
            wasPaused = videoEl.paused;
            videoEl.playbackRate = HOLD_SPEED;
            if (wasPaused) videoEl.play();
            badge.classList.add('visible');
        }

        function stop() {
            clearTimeout(timer);
            timer = null;
            if (!active) return;
            active = false;
            suppressClick = true; // the click event lands after pointerup
            videoEl.playbackRate = prevRate;
            if (wasPaused) videoEl.pause();
            badge.classList.remove('visible');
        }

        player.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            // don't hijack presses on the controls or our own scrub bars
            if (e.target.closest('.vjs-control-bar, .clipbar, .vjs-menu, .vjs-modal-dialog')) return;
            clearTimeout(timer);
            timer = setTimeout(start, HOLD_DELAY);
        });

        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
        window.addEventListener('blur', stop);

        // a hold shouldn't also register as the click that pauses the video
        player.addEventListener('click', e => {
            if (!suppressClick) return;
            suppressClick = false;
            e.stopPropagation();
            e.preventDefault();
        }, true);
    }

    // ---- clip history ----------------------------------------------------
    // The same VOD comes back repeatedly with different task ids and different
    // (sometimes overlapping, sometimes not) segments. Key the log by the VOD
    // hash from the URL and store the reviewed window with each verdict, so a
    // repeat shows what you decided before and which parts you've already seen.
    // Storage is deliberately terse -- localStorage is ~5MB for the whole origin
    // and this grows forever. Layout:
    //   { v:2, c:{ <16 hex of vod hash>: [ [task, start*10, len*10, code, minutes, tok] ] } }
    // where `code` is one char per subproblem (0 = not, 1 = uncertain, 2 = yes)
    // or "b" for a bad-clip report, and `tok` is the /vacnet/view?s= token
    // base64-packed (48 hex chars -> 32). The token can't be derived from the
    // task id, so it has to be kept verbatim if the history is to link anywhere.
    const HISTORY_KEY = 'vacnetClipHistory';
    const HISTORY_VER = 2;
    // ~60 bytes per entry all-in, so 20k VODs is ~1.2MB of a ~5MB budget.
    // At a few hundred clips a session this is years of headroom.
    const HISTORY_MAX_VODS = 20000;
    const HISTORY_MAX_PER_VOD = 50;
    const SUBS = ['aimassist', 'wallhack', 'autobhop', 'bot'];
    const SHORT_NAME = ['AIM', 'WH', 'BH', 'BOT'];

    function vodKey(src) {
        const m = (src || '').match(/([^/]+)\.webm/i);
        if (!m) return src || '';
        // the hash is 64 hex chars; 16 is plenty to tell VODs apart
        return m[1].replace(/^csow_/, '').slice(0, 16);
    }

    function encodeLabels(labels) {
        if (labels.indexOf('tag_badclip') >= 0) return 'b';
        const code = SUBS.map(() => '1');
        labels.forEach(l => {
            const m = l.match(/^(guilty|skip|innocent)_(.+)$/);
            if (!m) return;
            const i = SUBS.indexOf(m[2]);
            if (i < 0) return;
            code[i] = m[1] === 'guilty' ? '2' : (m[1] === 'skip' ? '1' : '0');
        });
        return code.join('');
    }

    // 48 hex chars -> 32 base64 chars. Length disambiguates on the way back:
    // packed is 32, raw hex is 40+, so a token that failed to pack still works.
    function packToken(hex) {
        if (!hex || !/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return hex || '';
        let bin = '';
        for (let i = 0; i < hex.length; i += 2) {
            bin += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        try { return btoa(bin).replace(/=+$/, ''); } catch (e) { return hex; }
    }

    function unpackToken(s) {
        if (!s) return null;
        if (s.length >= 40) return s; // stored unpacked
        try {
            const bin = atob(s);
            let hex = '';
            for (let i = 0; i < bin.length; i++) {
                hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
            }
            return hex;
        } catch (e) { return null; }
    }

    function currentViewToken() {
        const a = document.querySelector('.detailstable a[href*="/vacnet/view"]');
        if (!a) return '';
        const m = a.href.match(/[?&]s=([0-9a-f]+)/i);
        return m ? m[1] : '';
    }

    function loadHistory() {
        try {
            const h = JSON.parse(localStorage.getItem(HISTORY_KEY));
            if (!h || h.v !== HISTORY_VER || !h.c) return {};
            return h.c;
        } catch (e) { return {}; }
    }

    function saveHistory(c) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify({ v: HISTORY_VER, c: c }));
        } catch (e) {
            // out of quota: drop the oldest quarter and try once more, so the
            // log degrades gracefully instead of silently stopping forever
            try {
                const keys = Object.keys(c)
                    .map(k => ({ k: k, ts: Math.max.apply(null, c[k].map(x => x[4] || 0)) }))
                    .sort((a, b) => a.ts - b.ts);
                keys.slice(0, Math.ceil(keys.length / 4)).forEach(o => { delete c[o.k]; });
                localStorage.setItem(HISTORY_KEY, JSON.stringify({ v: HISTORY_VER, c: c }));
            } catch (e2) { /* give up quietly */ }
        }
    }

    // [task, start*10, len*10, code, minutesSinceEpoch, tok] -> usable object
    function decodeEntry(a) {
        const tok = unpackToken(a[5]);
        return {
            task: a[0],
            start: a[1] / 10,
            len: a[2] / 10,
            code: a[3],
            ts: a[4] * 60000,
            url: tok ? 'https://www.counter-strike.net/vacnet/view?s=' + tok : null
        };
    }

    function currentTaskId() {
        const i = document.querySelector('input[name="verdict_task"]');
        return i ? i.value : null;
    }

    function currentVodKey() {
        const v = pageVideoEl();
        let src = v ? (v.currentSrc || v.src) : '';
        // video.js resolves currentSrc asynchronously; the markup's <source> is
        // there from the start, so fall back to it rather than returning nothing
        if (!src) {
            const s = document.querySelector('.video-js source, #video source, video source');
            if (s) src = s.src || s.getAttribute('src') || '';
        }
        return src ? vodKey(src) : null;
    }

    // Reads the hidden verdict_labels[] the page builds on the form, so it logs
    // exactly what gets POSTed rather than re-deriving it from the radios.
    function recordCurrentVerdict(codeOverride) {
        const bounds = getClipBounds();
        const key = currentVodKey();
        if (!bounds || !key) return;
        const labels = Array.from(
            document.querySelectorAll('#submitverdictform input[name="verdict_labels[]"]')
        ).map(i => i.value);
        if (!labels.length && !codeOverride) return;

        const h = loadHistory();
        const list = h[key] || [];
        const task = parseInt(currentTaskId(), 10) || 0;
        const entry = [
            task,
            Math.round(bounds.start * 10),
            Math.round(bounds.len * 10),
            codeOverride || encodeLabels(labels),
            Math.round(Date.now() / 60000),
            packToken(currentViewToken())
        ];
        const at = task ? list.findIndex(e => e[0] === task) : -1;
        if (at >= 0) list[at] = entry; else list.push(entry);
        h[key] = list.slice(-HISTORY_MAX_PER_VOD);

        const keys = Object.keys(h);
        if (keys.length > HISTORY_MAX_VODS) {
            // evict least-recently-touched VODs first
            keys.map(k => ({ k: k, ts: Math.max.apply(null, h[k].map(e => e[4] || 0)) }))
                .sort((a, b) => a.ts - b.ts)
                .slice(0, keys.length - HISTORY_MAX_VODS)
                .forEach(o => { delete h[o.k]; });
        }
        saveHistory(h);
    }

    // Cache keyed by VOD, never on an empty key: an early tick (before the
    // source resolves) must not poison the cache with an empty result.
    let seenCache = null;
    let seenCacheKey = null;
    function seenEntries() {
        const key = currentVodKey();
        if (!key) return [];
        if (seenCacheKey === key && seenCache) return seenCache;
        const task = parseInt(currentTaskId(), 10) || 0;
        seenCache = (loadHistory()[key] || [])
            .filter(e => !task || e[0] !== task)
            .map(decodeEntry)
            .sort((a, b) => b.ts - a.ts);
        seenCacheKey = key;
        return seenCache;
    }

    function summarize(code) {
        if (code === 'b') return { text: 'bad clip', cls: 'seen-bad' };
        const guilty = [];
        const skip = [];
        String(code).split('').forEach((c, i) => {
            const name = SHORT_NAME[i] || SUBS[i] || '?';
            if (c === '2') guilty.push(name);
            else if (c === '1') skip.push(name);
        });
        if (guilty.length) return { text: guilty.join(' + '), cls: 'seen-guilty' };
        if (skip.length) return { text: 'uncertain: ' + skip.join(', '), cls: 'seen-uncertain' };
        return { text: 'clean', cls: 'seen-clean' };
    }

    function ago(ts) {
        const s = Math.max(0, (Date.now() - ts) / 1000);
        if (s < 90) return Math.round(s) + 's ago';
        if (s < 5400) return Math.round(s / 60) + 'm ago';
        if (s < 172800) return Math.round(s / 3600) + 'h ago';
        return Math.round(s / 86400) + 'd ago';
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    function ensureHistoryPanel() {
        const col = document.querySelector('.verdict-column');
        if (!col || col.querySelector('.cliphistory')) return;
        if (!pageVideoEl() || !getClipBounds()) return; // wait until we can key it
        const entries = seenEntries();
        if (!entries.length) return;

        const box = document.createElement('div');
        box.className = 'cliphistory';
        box.innerHTML =
            '<div class="cliphistory-head">Seen this VOD ' + entries.length +
            (entries.length === 1 ? ' time before' : ' times before') + '</div>' +
            entries.map(e => {
                const s = summarize(e.code);
                const seg = e.start.toFixed(1) + 's → ' + (e.start + e.len).toFixed(1) + 's';
                const task = e.url
                    ? '<a href="' + esc(e.url) + '" target="_blank" rel="noreferrer">#' + esc(e.task) + '</a>'
                    : '#' + esc(e.task);
                return '<div class="cliphistory-row">' +
                    '<span class="cliphistory-verdict ' + s.cls + '">' + esc(s.text) + '</span>' +
                    '<span class="cliphistory-seg">' + esc(seg) + '</span>' +
                    '<span class="cliphistory-meta">' + esc(ago(e.ts)) + ' · ' + task + '</span>' +
                    '</div>';
            }).join('');
        col.appendChild(box);
    }

    // ---- memorable name per VOD ------------------------------------------
    // A 16-hex key is impossible to recognise at a glance; three short words
    // derived from it are. Purely a display alias -- deterministic, so the same
    // VOD always gets the same name, and never sent anywhere.
    // Xbox-style: CamelCase adjective + animal/noun, then a short number,
    // e.g. SwiftOtter482.
    const NAME_ADJ = [
        'Ample', 'Bold', 'Brave', 'Bright', 'Brisk', 'Calm', 'Chilly', 'Clever',
        'Cosmic', 'Crafty', 'Daring', 'Dapper', 'Eager', 'Elder', 'Epic', 'Fancy',
        'Fierce', 'Frosty', 'Gentle', 'Giant', 'Glad', 'Grand', 'Happy', 'Hasty',
        'Humble', 'Jolly', 'Keen', 'Lucky', 'Major', 'Merry', 'Mighty', 'Nimble',
        'Noble', 'Prime', 'Proud', 'Quick', 'Quiet', 'Rapid', 'Royal', 'Sharp',
        'Silent', 'Sleepy', 'Smooth', 'Solar', 'Spicy', 'Steady', 'Stern', 'Sunny',
        'Super', 'Swift', 'Tidy', 'Tiny', 'Total', 'Ultra', 'Urban', 'Vast',
        'Vivid', 'Warm', 'Wild', 'Wise', 'Witty', 'Zany', 'Zesty', 'Lively'
    ];
    const NAME_NOUN = [
        'Acorn', 'Badger', 'Beacon', 'Bison', 'Bobcat', 'Boulder', 'Cactus', 'Canyon',
        'Cheetah', 'Cobra', 'Comet', 'Condor', 'Cougar', 'Coyote', 'Crane', 'Dolphin',
        'Dragon', 'Eagle', 'Falcon', 'Ferret', 'Finch', 'Gecko', 'Glacier', 'Gopher',
        'Griffin', 'Hammer', 'Harbor', 'Hawk', 'Heron', 'Hornet', 'Ibex', 'Jackal',
        'Jaguar', 'Kestrel', 'Koala', 'Lantern', 'Lemur', 'Lynx', 'Magpie', 'Mammoth',
        'Marmot', 'Meerkat', 'Moose', 'Narwhal', 'Ocelot', 'Osprey', 'Otter', 'Panda',
        'Panther', 'Pelican', 'Puffin', 'Quokka', 'Rabbit', 'Raven', 'Rhino', 'Salmon',
        'Seagull', 'Shrike', 'Sparrow', 'Tiger', 'Turtle', 'Viper', 'Walrus', 'Wombat'
    ];

    function vodName(key) {
        if (!key) return null;
        // independent slices of the hash -> independent picks
        const a = parseInt(key.slice(0, 5), 16) || 0;
        const b = parseInt(key.slice(5, 10), 16) || 0;
        const n = parseInt(key.slice(10, 16), 16) || 0;
        return NAME_ADJ[a % NAME_ADJ.length] +
               NAME_NOUN[b % NAME_NOUN.length] +
               (n % 1000);
    }

    function ensureVodName() {
        const col = document.querySelector('.verdict-column');
        if (!col) return;
        const key = currentVodKey();
        if (!key) return;
        const name = vodName(key);
        let el = col.querySelector('.vodname');
        if (el && el.dataset.key === key) return;
        if (!el) {
            el = document.createElement('div');
            el.className = 'vodname';
            col.insertBefore(el, col.firstChild);
        }
        el.dataset.key = key;
        const seen = seenEntries().length;
        el.innerHTML =
            '<span class="vodname-label">Now watching</span>' +
            '<span class="vodname-name">' + esc(name) + '</span>' +
            '<span class="vodname-id" title="VOD ' + esc(key) + '">' + esc(key.slice(0, 8)) + '</span>' +
            (seen ? '<span class="vodname-seen">seen ' + seen + '×</span>' : '');
    }

    // ---- overlap with previously reviewed segments -----------------------
    // Repeats of a VOD often cover part of a window you already judged. Work out
    // which slices of the CURRENT clip you've seen before, clipped to this clip's
    // bounds, so they can be painted over the bar and warned about.
    const OVERLAP_MIN = 0.15; // seconds; ignore slivers from rounding

    let overlapCache = null;
    let overlapCacheKey = null;
    function overlapSegments() {
        const key = currentVodKey();
        if (!key) return [];
        if (overlapCacheKey === key && overlapCache) return overlapCache;
        const b = getClipBounds();
        if (!b) return [];
        const from = b.start;
        const to = b.start + b.len;
        overlapCache = seenEntries().map(e => {
            const s = Math.max(from, e.start);
            const en = Math.min(to, e.start + e.len);
            if (en - s < OVERLAP_MIN) return null;
            const sum = summarize(e.code);
            return {
                start: s,
                len: en - s,
                cls: sum.cls,
                verdict: sum.text,
                share: (en - s) / b.len, // how much of THIS clip you've already seen
                ts: e.ts,
                task: e.task,
                url: e.url
            };
        }).filter(Boolean).sort((a, b2) => b2.share - a.share);
        overlapCacheKey = key;
        return overlapCache;
    }

    function ensureOverlapWarning() {
        const col = document.querySelector('.verdict-column');
        if (!col || col.querySelector('.overlapwarn')) return;
        if (!pageVideoEl() || !getClipBounds()) return;
        const laps = overlapSegments();
        if (!laps.length) return;

        const box = document.createElement('div');
        box.className = 'overlapwarn';
        box.innerHTML =
            '<div class="overlapwarn-head">⚠ Overlaps ' + laps.length + ' previous review' +
            (laps.length === 1 ? '' : 's') + ' of this VOD</div>' +
            laps.map(o => {
                const task = o.url
                    ? '<a href="' + esc(o.url) + '" target="_blank" rel="noreferrer">#' + esc(o.task) + '</a>'
                    : '#' + esc(o.task);
                return '<div class="overlapwarn-row">' +
                    '<span class="cliphistory-verdict ' + o.cls + '">' + esc(o.verdict) + '</span>' +
                    '<span class="overlapwarn-share">' + Math.round(o.share * 100) + '% of this clip</span>' +
                    '<span class="cliphistory-meta">' + esc(ago(o.ts)) + ' · ' + task + '</span>' +
                    '</div>';
            }).join('');
        col.insertBefore(box, col.firstChild);
    }

    // ---- full history popup ----------------------------------------------
    // Everything logged, newest first, grouped by VOD so repeat visits to the
    // same source video read as one block rather than scattered rows.
    const HISTORY_POPUP_GROUPS = 150;

    function historyGroups() {
        const h = loadHistory();
        const cur = currentVodKey();
        return Object.keys(h)
            .map(k => {
                const items = h[k].map(decodeEntry).sort((a, b) => b.ts - a.ts);
                return {
                    key: k,
                    items: items,
                    latest: items.length ? items[0].ts : 0,
                    current: k === cur
                };
            })
            .sort((a, b) => b.latest - a.latest)
            .slice(0, HISTORY_POPUP_GROUPS);
    }

    function buildHistoryPopup() {
        const groups = historyGroups();
        const total = groups.reduce((n, g) => n + g.items.length, 0);

        const overlay = document.createElement('div');
        overlay.className = 'histpopup-overlay';
        overlay.innerHTML =
            '<div class="histpopup">' +
            '<div class="histpopup-head">' +
            '<span>Review history — ' + total + ' review' + (total === 1 ? '' : 's') +
            ' across ' + groups.length + ' VOD' + (groups.length === 1 ? '' : 's') + '</span>' +
            '<span class="histpopup-close">X</span>' +
            '</div>' +
            '<div class="histpopup-body">' +
            (groups.length ? groups.map(g =>
                '<div class="histgroup' + (g.current ? ' is-current' : '') + '">' +
                '<div class="histgroup-head">' +
                '<span class="histgroup-id">VOD ' + esc(g.key) + '</span>' +
                '<span class="histgroup-count">' + g.items.length + '×</span>' +
                (g.current ? '<span class="histgroup-now">watching now</span>' : '') +
                '</div>' +
                g.items.map(e => {
                    const s = summarize(e.code);
                    const seg = e.start.toFixed(1) + 's → ' + (e.start + e.len).toFixed(1) + 's';
                    const task = e.url
                        ? '<a href="' + esc(e.url) + '" target="_blank" rel="noreferrer">#' + esc(e.task) + '</a>'
                        : '<span class="histrow-notask">#' + esc(e.task) + '</span>';
                    return '<div class="histrow">' +
                        '<span class="cliphistory-verdict ' + s.cls + '">' + esc(s.text) + '</span>' +
                        '<span class="cliphistory-seg">' + esc(seg) + '</span>' +
                        '<span class="cliphistory-meta">' + esc(ago(e.ts)) + ' · ' + task + '</span>' +
                        '</div>';
                }).join('') +
                '</div>'
            ).join('') : '<div class="histpopup-empty">Nothing logged yet.</div>') +
            '</div>' +
            '</div>';

        function close() {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
        }
        function onKey(e) {
            if (e.key === 'Escape') close();
        }
        overlay.addEventListener('click', e => {
            if (e.target === overlay || e.target.classList.contains('histpopup-close')) close();
        });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(overlay);
    }

    // ---- share the current clip ------------------------------------------
    // The hidden Clip Details table carries the only shareable link for a task
    // (/vacnet/view?s=<token>); the token can't be derived from anything else.
    function currentShareUrl() {
        const a = document.querySelector('.detailstable a[href*="/vacnet/view"]');
        if (a) return a.href;
        const tok = currentViewToken();
        return tok ? 'https://www.counter-strike.net/vacnet/view?s=' + tok : null;
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // clipboard API needs a secure context / permission; fall back
        return new Promise((resolve, reject) => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            ok ? resolve() : reject(new Error('copy failed'));
        });
    }

    function ensureShareButton() {
        const col = document.querySelector('.verdict-column');
        if (!col || col.querySelector('.sharebutton')) return;
        const url = currentShareUrl();
        if (!url) return; // details table not rendered for this task

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sharebutton';
        const label = '🔗 Copy share link';
        btn.textContent = label;
        btn.title = url + '\n(shift-click to open in a new tab)';
        btn.addEventListener('click', e => {
            if (e.shiftKey) {
                window.open(url, '_blank', 'noreferrer');
                return;
            }
            copyText(url).then(() => {
                btn.textContent = '✓ Copied';
                btn.classList.add('copied');
            }).catch(() => {
                btn.textContent = 'copy blocked — link in tooltip';
            }).then(() => {
                setTimeout(() => {
                    btn.textContent = label;
                    btn.classList.remove('copied');
                }, 1600);
            });
        });
        col.appendChild(btn);
    }

    function ensureHistoryButton() {
        const col = document.querySelector('.verdict-column');
        if (!col || col.querySelector('.histbutton')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'histbutton';
        btn.textContent = '🕘 Review history';
        btn.title = 'Everything you have labeled, grouped by source VOD';
        btn.addEventListener('click', buildHistoryPopup);
        col.appendChild(btn);
    }

    // ---- one-click verdict presets ---------------------------------------
    // Each preset maps subproblem -> radio suffix (positive / skip / negative).
    const PRESETS = [
        {
            name: 'Legit',
            cls: 'preset-legit',
            title: 'Not aim assist, not wall hack, not auto bhop, not bot',
            set: { aimassist: 'negative', wallhack: 'negative', autobhop: 'negative', bot: 'negative' }
        },
        {
            name: 'WH',
            cls: 'preset-wh',
            title: 'Wall hack, aim assist uncertain, not auto bhop, not bot',
            set: { aimassist: 'skip', wallhack: 'positive', autobhop: 'negative', bot: 'negative' }
        },
        {
            name: 'HVH',
            cls: 'preset-hvh',
            title: 'Aim assist, wall hack, auto bhop, not bot',
            set: { aimassist: 'positive', wallhack: 'positive', autobhop: 'positive', bot: 'negative' }
        }
    ];

    function applyPreset(preset) {
        for (const sub in preset.set) {
            const input = document.getElementById(sub + '_' + preset.set[sub]);
            if (!input) continue; // confirm screen has replaced the radios
            input.checked = true;
            // the page reads .checked directly, but fire change for any CSS/JS hooks
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function ensurePresets() {
        const col = document.querySelector('.verdict-column');
        if (!col || col.querySelector('.presetbuttons')) return;
        const row = document.createElement('div');
        row.className = 'presetbuttons';
        PRESETS.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'presetbutton ' + p.cls;
            btn.textContent = p.name;
            btn.title = p.title;
            btn.addEventListener('click', () => applyPreset(p));
            row.appendChild(btn);
        });
        col.appendChild(row);
    }

    // ---- download just the clip ------------------------------------------
    // The source is the whole match VOD, and a browser can't losslessly cut a
    // WebM without demuxing it, so we capture the element's stream while the
    // clip plays through once in real time. That means a re-encode and it takes
    // as long as the clip is (~12s), but it needs no external libraries.
    // Container choice. MediaRecorder MP4 support (H.264/AAC) landed in Chrome
    // 130; anything older only has WebM, so we probe and offer what actually
    // works rather than advertising both.
    const FORMATS = [
        {
            id: 'mp4',
            label: 'MP4',
            ext: 'mp4',
            types: [
                'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
                'video/mp4;codecs=avc1,mp4a.40.2',
                'video/mp4;codecs=avc1',
                'video/mp4'
            ]
        },
        {
            id: 'webm',
            label: 'WebM',
            ext: 'webm',
            types: [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm'
            ]
        }
    ];
    const FORMAT_KEY = 'vacnetClipFormat';

    function supportedMime(format) {
        if (typeof W.MediaRecorder === 'undefined') return null;
        return format.types.find(t => MediaRecorder.isTypeSupported(t)) || null;
    }

    function availableFormats() {
        return FORMATS.filter(supportedMime);
    }

    function chosenFormat() {
        const list = availableFormats();
        if (!list.length) return null;
        let saved = null;
        try { saved = localStorage.getItem(FORMAT_KEY); } catch (e) { /* storage blocked */ }
        return list.find(f => f.id === saved) || list[0];
    }

    function clipFilename(videoEl, bounds, ext) {
        let base = 'clip';
        const src = videoEl.currentSrc || videoEl.src || '';
        const m = src.match(/([^/]+)\.webm/i);
        if (m) base = m[1].slice(0, 24);
        return base + '_' + bounds.start.toFixed(1) + 's+' + bounds.len.toFixed(1) + 's.' + ext;
    }

    // The page's <video> is cross-origin and has no crossorigin attribute, so it
    // is tainted and captureStream() throws SecurityError. We therefore never
    // record the page's element -- we build our own offscreen one that isn't
    // tainted, by whichever of these works:
    //   1. same URL with crossOrigin="anonymous" (free, streams as it plays)
    //   2. GM_xmlhttpRequest the bytes and play them from a blob: URL
    //      (privileged, ignores CORS, but downloads the whole VOD first)
    function makeOffscreenVideo(withCors) {
        const v = document.createElement('video');
        if (withCors) v.crossOrigin = 'anonymous';
        v.preload = 'auto';
        v.playsInline = true;
        // offscreen rather than display:none -- hidden elements can get their
        // frame production throttled, which would stall the capture
        v.style.cssText = 'position:fixed;left:-10000px;top:0;width:640px;height:360px;opacity:0;pointer-events:none;z-index:-1;';
        document.body.appendChild(v);
        return v;
    }

    function getCapturableVideo(src, btn, cb) {
        // --- attempt 1: CORS-clean element, no download needed
        const probe = makeOffscreenVideo(true);
        let settled = false;

        const giveUp = () => {
            if (settled) return;
            settled = true;
            probe.remove();
            fetchViaGM();
        };
        const succeed = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            cb(probe, null);
        };

        probe.addEventListener('loadeddata', succeed);
        probe.addEventListener('error', giveUp);
        const timer = setTimeout(giveUp, 8000);
        probe.src = src;
        probe.load();

        // --- attempt 2: pull the bytes with the userscript's privileged request
        function fetchViaGM() {
            if (typeof GM_xmlhttpRequest !== 'function') {
                cb(null, 'no CORS and GM_xmlhttpRequest unavailable');
                return;
            }
            btn.textContent = 'downloading VOD...';
            GM_xmlhttpRequest({
                method: 'GET',
                url: src,
                responseType: 'blob',
                onprogress: e => {
                    if (e.lengthComputable) {
                        btn.textContent = 'downloading VOD ' + Math.round((e.loaded / e.total) * 100) + '%';
                    }
                },
                onerror: () => cb(null, 'download failed'),
                ontimeout: () => cb(null, 'download timed out'),
                onload: r => {
                    if (!r.response) { cb(null, 'empty response'); return; }
                    const v = makeOffscreenVideo(false);
                    const url = URL.createObjectURL(r.response);
                    v.addEventListener('loadeddata', () => cb(v, null), { once: true });
                    v.addEventListener('error', () => cb(null, 'blob decode failed'), { once: true });
                    v.src = url;
                    v.load();
                }
            });
        }
    }

    function downloadClip(btn) {
        const pageVideo = document.querySelector('.video-js video');
        const bounds = getClipBounds();
        if (!pageVideo || !bounds) return;

        const src = pageVideo.currentSrc || pageVideo.src;
        const format = chosenFormat();
        if (!src || !format) {
            btn.textContent = 'unsupported browser';
            return;
        }
        const mimeType = supportedMime(format);

        const label = '⬇ Download clip';
        btn.disabled = true;
        btn.classList.add('recording');
        btn.textContent = 'preparing...';

        // Created here, inside the click gesture -- an AudioContext constructed
        // later (after the async fetch) can be born suspended and would record
        // silence.
        let audioCtx = null;
        try {
            const AC = W.AudioContext || W.webkitAudioContext;
            if (AC) audioCtx = new AC();
        } catch (e) { /* no Web Audio -> fall back to audible capture */ }

        function fail(msg) {
            btn.textContent = msg;
            btn.classList.remove('recording');
            setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 2500);
        }

        getCapturableVideo(src, btn, (srcVideo, err) => {
            if (err || !srcVideo) { fail(err || 'capture failed'); return; }

            const cleanup = () => {
                try { srcVideo.pause(); } catch (e) { /* gone */ }
                if (srcVideo.src.startsWith('blob:')) URL.revokeObjectURL(srcVideo.src);
                srcVideo.remove();
                if (audioCtx) { try { audioCtx.close(); } catch (e) { /* already closed */ } }
            };

            const capture = srcVideo.captureStream || srcVideo.mozCaptureStream;
            let rec;
            try {
                const stream = capture.call(srcVideo);

                // Silent capture: routing the element through a MediaElementSource
                // takes its audio off the speakers entirely. We connect it only to
                // a MediaStreamDestination -- never to audioCtx.destination -- so
                // the sound lands in the recording but is never played out loud.
                let audioTracks = stream.getAudioTracks();
                if (audioCtx) {
                    try {
                        const source = audioCtx.createMediaElementSource(srcVideo);
                        const dest = audioCtx.createMediaStreamDestination();
                        source.connect(dest);
                        audioCtx.resume();
                        audioTracks = dest.stream.getAudioTracks();
                    } catch (e) {
                        // graph failed -- keep captureStream's audio (audible)
                    }
                }

                const mixed = new MediaStream(stream.getVideoTracks().concat(audioTracks));
                rec = new MediaRecorder(mixed, { mimeType, videoBitsPerSecond: 8000000 });
            } catch (e) {
                cleanup();
                fail('capture failed');
                return;
            }

            const chunks = [];
            rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
            rec.onstop = () => {
                const blob = new Blob(chunks, { type: rec.mimeType || mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = clipFilename(pageVideo, bounds, format.ext);
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 30000);
                cleanup();
                btn.classList.remove('recording');
                btn.disabled = false;
                btn.textContent = label;
            };

            // The offscreen copy plays silently (its audio is routed into the
            // recorder, not the speakers), so leave the page's player alone --
            // you can keep watching and listening to the clip while it records.
            srcVideo.muted = false; // muting would silence the graph too
            srcVideo.volume = 1;
            srcVideo.playbackRate = 1; // capture is wall-clock; any other rate skews it

            srcVideo.currentTime = bounds.start;
            srcVideo.addEventListener('seeked', function onSeeked() {
                srcVideo.removeEventListener('seeked', onSeeked);
                rec.start(100);
                srcVideo.play();

                (function watch() {
                    if (rec.state !== 'recording') return;
                    const done = srcVideo.currentTime - bounds.start;
                    if (done >= bounds.len || srcVideo.ended) {
                        rec.stop();
                        return;
                    }
                    btn.textContent = 'recording ' + done.toFixed(1) + 's / ' + bounds.len.toFixed(1) + 's';
                    requestAnimationFrame(watch);
                })();
            }, { once: true });
        });
    }

    function ensureDownloadButton() {
        const col = document.querySelector('.verdict-column');
        if (!col || col.querySelector('.downloadrow')) return;

        const row = document.createElement('div');
        row.className = 'downloadrow';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'downloadclip';
        btn.textContent = '⬇ Download clip';
        btn.title = 'Plays the clip through once and saves that window to a file';
        btn.addEventListener('click', () => downloadClip(btn));
        row.appendChild(btn);

        const formats = availableFormats();
        if (formats.length > 1) {
            const sel = document.createElement('select');
            sel.className = 'downloadformat';
            sel.title = 'Output container';
            const current = chosenFormat();
            formats.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.textContent = f.label;
                if (current && f.id === current.id) opt.selected = true;
                sel.appendChild(opt);
            });
            sel.addEventListener('change', () => {
                try { localStorage.setItem(FORMAT_KEY, sel.value); } catch (e) { /* storage blocked */ }
            });
            row.appendChild(sel);
        }

        col.appendChild(row);
    }

    // ---- instant submit + history logging --------------------------------
    // Both of these used to reach through unsafeWindow for the page's own
    // functions (SetModeConfirmLabels / SubmitLabels / ReportBadClip). That is
    // fragile: depending on the userscript manager and Firefox's Xray wrappers,
    // unsafeWindow may not expose page globals at all, in which case the patch
    // silently did nothing and Proceed fell back to the confirm screen.
    //
    // This version touches no page globals. It watches clicks in the capture
    // phase, lets the page's own handler do its work, then drives the resulting
    // DOM itself -- which behaves identically in every manager and browser.
    function installSubmitFlow() {
        if (document.documentElement.dataset.vacnetSubmitFlow) return;
        document.documentElement.dataset.vacnetSubmitFlow = '1';

        document.addEventListener('click', e => {
            const t = e.target;
            if (!t || !t.closest) return;

            // Report Bad Clip: we know the outcome without reading the form,
            // and the page navigates away immediately, so log it right now.
            const bad = t.closest('a[onclick*="ReportBadClip"]');
            if (bad) {
                try { recordCurrentVerdict('b'); } catch (err) { /* never block a submit */ }
                return;
            }

            const btn = t.closest('#submitVerdictButton');
            if (!btn) return;
            const wasProceed = !document.getElementById('backbutton');

            // after the page's handler has built the hidden verdict_labels[]
            setTimeout(() => {
                try { recordCurrentVerdict(); } catch (err) { /* never block a submit */ }
                if (!wasProceed) return;
                // now on the confirm screen: press Confirm for the user
                const confirmBtn = document.getElementById('submitVerdictButton');
                if (confirmBtn && document.getElementById('backbutton')) confirmBtn.click();
            }, 0);
        }, true);
    }

    // Send Feedback / Report Bad Clip live in the page footer; relocate the whole
    // button row to the bottom of the verdict column. Moving the node (rather than
    // rebuilding it) keeps the inline ReportBadClip() onclick intact.
    function moveFooterButtons() {
        const col = document.querySelector('.verdict-column');
        const buttons = document.querySelector('.footer-buttons');
        if (!col || !buttons) return;
        if (buttons.parentElement === col && buttons === col.lastElementChild) return;
        col.appendChild(buttons);
    }

    // Each step is isolated: one throwing step used to take down every step
    // after it in the same tick, so a single browser-specific failure could
    // silently disable half the script. Report once per step, then carry on.
    const tickFailed = {};
    function step(name, fn) {
        try {
            fn();
        } catch (e) {
            if (!tickFailed[name]) {
                tickFailed[name] = true;
                console.warn('[vacnet-bigplayer] ' + name + ' failed:', e);
            }
        }
    }

    function tick() {
        step('unsizePlayer', unsizePlayer);
        step('killJunk', killJunk);
        step('stripLabelPrefix', stripLabelPrefix);
        step('ensureClipBar', ensureClipBar);
        step('ensureResizer', ensureResizer);
        step('ensureClipLoop', ensureClipLoop);
        step('ensureKeys', ensureKeys);
        step('ensureWheelSeek', ensureWheelSeek);
        step('ensureHoldSpeed', ensureHoldSpeed);
        step('ensurePresets', ensurePresets);
        step('ensureDownloadButton', ensureDownloadButton);
        step('ensureOverlapWarning', ensureOverlapWarning);
        step('ensureVodName', ensureVodName); // last inserted -> sits on top
        step('ensureHistoryPanel', ensureHistoryPanel);
        step('ensureShareButton', ensureShareButton);
        step('ensureHistoryButton', ensureHistoryButton);
        step('installSubmitFlow', installSubmitFlow);
        step('moveFooterButtons', moveFooterButtons);
    }

    document.addEventListener('DOMContentLoaded', tick);
    window.addEventListener('load', () => {
        tick();
        // video.js finishes wiring up slightly after load
        setTimeout(tick, 200);
        setTimeout(tick, 1000);
    });

    new MutationObserver(tick).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
