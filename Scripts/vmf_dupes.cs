using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;

partial class VMFDupes
{
	readonly record struct Vector3(float X, float Y, float Z)
	{
		[MethodImpl(MethodImplOptions.AggressiveInlining)]
		public bool Equals(Vector3 other, float tolerance = 0.01f)
			=> Math.Abs(X - other.X) < tolerance &&
			   Math.Abs(Y - other.Y) < tolerance &&
			   Math.Abs(Z - other.Z) < tolerance;

		public override string ToString() => $"({X:F2}, {Y:F2}, {Z:F2})";
	}

	struct ObjectInfo
	{
		public string Type;
		public string SpecificType;
		public string Id;
		public Vector3 Origin;
		public Dictionary<string, string>? KeyValues;
		public bool IsHintOrSkip;
	}

	static void Main(string[] args)
	{
		if (args.Length < 1)
		{
			Console.WriteLine("Usage: Program.exe <path_to_vmf>");
			return;
		}

		string vmfPath = args[0];
		if (!File.Exists(vmfPath))
		{
			Console.WriteLine($"Error: File '{vmfPath}' not found.");
			return;
		}

		try
		{
			List<ObjectInfo> objects = ParseVmf(vmfPath);
			FindDuplicates(objects);
			ReportPropStaticDynamicConflicts(objects);
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Error processing VMF file: {ex.Message}");
		}
	}

	static List<ObjectInfo> ParseVmf(string filePath)
	{
		Console.WriteLine("Parsing VMF content...");
		List<ObjectInfo> objects = new(1000);
		List<(string Id, string Texture)> hintSkipBrushes = new(100);
		Dictionary<int, string> entityIdToClassname = [];

		using StreamReader reader = new(filePath);
		string? line;
		string currentBlock = "";
		bool inSolid = false, inEntity = false, inVerticesPlus = false;
		int solidCount = 0, entityCount = 0, totalBlocks = 0;

		using (var tempReader = new StreamReader(filePath))
		{
			while ((line = tempReader.ReadLine()) != null)
			{
				if (line.TrimStart().StartsWith("solid", StringComparison.OrdinalIgnoreCase) ||
					line.TrimStart().StartsWith("entity", StringComparison.OrdinalIgnoreCase))
					totalBlocks++;
			}
		}

		reader.BaseStream.Position = 0;
		reader.DiscardBufferedData();

		while ((line = reader.ReadLine()) != null)
		{
			if (inVerticesPlus)
			{
				if (line.Contains('}')) inVerticesPlus = false;
				continue;
			}

			if (line.TrimStart().StartsWith("vertices_plus", StringComparison.OrdinalIgnoreCase))
			{
				inVerticesPlus = true;
				continue;
			}

			currentBlock += line + "\n";

			if (line.Contains('{')) continue;
			if (line.Contains('}'))
			{
				string blockString = currentBlock;
				ReadOnlySpan<char> blockSpan = blockString.AsSpan().Trim();
				if (inSolid)
				{
					solidCount++;
					if (solidCount % 250 == 0 || solidCount == totalBlocks)
						Console.WriteLine($"Processing solid {solidCount}/{totalBlocks}...");

					ProcessSolid(blockSpan, blockString, objects, hintSkipBrushes, entityIdToClassname);
					inSolid = false;
				}
				else if (inEntity)
				{
					entityCount++;
					ProcessEntity(blockSpan, blockString, objects);
					inEntity = false;
				}
				currentBlock = "";
				continue;
			}
			if (line.TrimStart().StartsWith("solid", StringComparison.OrdinalIgnoreCase))
				inSolid = true;
			else if (line.TrimStart().StartsWith("entity", StringComparison.OrdinalIgnoreCase))
				inEntity = true;
		}

		if (hintSkipBrushes.Count > 0)
		{
			Console.WriteLine("\nDetected Hint/Skip Brushes:");
			foreach (var (id, texture) in hintSkipBrushes)
			{
				Console.WriteLine($"  Brush ID {id} with texture '{texture}'");
			}
		}

		return objects;
	}

	static void ProcessSolid(ReadOnlySpan<char> blockContent, string blockString, List<ObjectInfo> objects,
		List<(string Id, string Texture)> hintSkipBrushes, Dictionary<int, string> entityIdToClassname)
	{
		var idMatch = idreg().Match(blockString);
		if (!idMatch.Success)
		{
			Console.WriteLine($"Warning: Skipping solid with no valid ID in block: {blockContent[..Math.Min(50, blockContent.Length)]}...");
			return;
		}
		string id = idMatch.Groups[1].Value;

		Vector3? center = CalculateBrushCenter(blockString);
		if (!center.HasValue)
		{
			Console.WriteLine($"Warning: Skipping solid ID {id} with invalid center.");
			return;
		}

		bool isHintOrSkip = false;
		string specificType = "solid";
		string? detectedTexture;

		var sideMatches = sidereg().Matches(blockString);
		foreach (Match side in sideMatches)
		{
			var materialMatch = matreg().Match(side.Value);
			if (materialMatch.Success)
			{
				string material = materialMatch.Groups[1].Value;
				if (material.Contains("TOOLSHINT", StringComparison.OrdinalIgnoreCase) ||
					material.Contains("TOOLSSKIP", StringComparison.OrdinalIgnoreCase))
				{
					isHintOrSkip = true;
					detectedTexture = material;
					hintSkipBrushes.Add((id, material));
					break;
				}
			}
		}


		int blockId = int.Parse(id, CultureInfo.InvariantCulture);
		if (entityIdToClassname.TryGetValue(blockId, out string? className))
			specificType = className;

		objects.Add(new ObjectInfo
		{
			Type = "brush",
			SpecificType = specificType,
			Id = id,
			Origin = center.Value,
			KeyValues = null,
			IsHintOrSkip = isHintOrSkip
		});
	}

	static void ProcessEntity(ReadOnlySpan<char> blockContent, string blockString, List<ObjectInfo> objects)
	{
		var idMatch = idreg().Match(blockString);
		if (!idMatch.Success) return;
		string id = idMatch.Groups[1].Value;

		Vector3? origin = GetEntityOrigin(blockString);
		var keyValues = GetEntityKeyValues(blockString);
		string specificType = keyValues.TryGetValue("classname", out string? value) ? value : "unknown";

		objects.Add(new ObjectInfo
		{
			Type = "entity",
			SpecificType = specificType,
			Id = id,
			Origin = origin ?? new Vector3(0, 0, 0),
			KeyValues = keyValues,
			IsHintOrSkip = false
		});
	}

	static Vector3? CalculateBrushCenter(string blockContent)
	{
		List<Vector3> vertices = new(8);
		var planeMatches = planereg().Matches(blockContent);

		foreach (Match match in planeMatches)
		{
			if (match.Groups.Count == 4 &&
				float.TryParse(match.Groups[1].ValueSpan, NumberStyles.Float, CultureInfo.InvariantCulture, out float x) &&
				float.TryParse(match.Groups[2].ValueSpan, NumberStyles.Float, CultureInfo.InvariantCulture, out float y) &&
				float.TryParse(match.Groups[3].ValueSpan, NumberStyles.Float, CultureInfo.InvariantCulture, out float z))
			{
				vertices.Add(new Vector3(x, y, z));
			}
		}

		if (vertices.Count < 3) return null;

		float xSum = 0, ySum = 0, zSum = 0;
		foreach (var v in vertices)
		{
			xSum += v.X;
			ySum += v.Y;
			zSum += v.Z;
		}
		return new Vector3(xSum / vertices.Count, ySum / vertices.Count, zSum / vertices.Count);
	}

	static Vector3? GetEntityOrigin(string blockContent)
	{
		var originMatch = originreg().Match(blockContent);
		if (originMatch.Success && originMatch.Groups.Count == 4 &&
			float.TryParse(originMatch.Groups[1].ValueSpan, NumberStyles.Float, CultureInfo.InvariantCulture, out float x) &&
			float.TryParse(originMatch.Groups[2].ValueSpan, NumberStyles.Float, CultureInfo.InvariantCulture, out float y) &&
			float.TryParse(originMatch.Groups[3].ValueSpan, NumberStyles.Float, CultureInfo.InvariantCulture, out float z))
		{
			return new Vector3(x, y, z);
		}
		return null;
	}

	static Dictionary<string, string> GetEntityKeyValues(string blockContent)
	{
		var keyValues = new Dictionary<string, string>(16);
		var keyValueMatches = kvreg().Matches(blockContent);
		foreach (Match match in keyValueMatches)
		{
			if (match.Groups.Count == 3)
			{
				keyValues[match.Groups[1].Value] = match.Groups[2].Value;
			}
		}
		return keyValues;
	}

	static void FindDuplicates(List<ObjectInfo> objects)
	{
		var originGroups = new Dictionary<(int, int, int), List<(ObjectInfo Obj, string? Model, string? TargetName)>>();
		var processed = new HashSet<string>(objects.Count);

		for (int i = 0; i < objects.Count; i++)
		{
			if (i % 100 == 0 || i == objects.Count - 1)
				Console.WriteLine($"Processing object {i + 1}/{objects.Count}...");

			var obj = objects[i];
			if (processed.Contains(obj.Id) || obj.Origin.ToString() == "(0.00, 0.00, 0.00)")
			{
				processed.Add(obj.Id);
				continue;
			}

			if (obj.IsHintOrSkip)
			{
				processed.Add(obj.Id);
				continue;
			}

			var key = (x: (int)Math.Round(obj.Origin.X / 0.01f),
					  y: (int)Math.Round(obj.Origin.Y / 0.01f),
					  z: (int)Math.Round(obj.Origin.Z / 0.01f));

			string? model = obj.Type == "entity" && obj.KeyValues != null && obj.KeyValues.TryGetValue("model", out string? value)
				? value : null;
			string? targetName = obj.Type == "entity" && obj.KeyValues != null && obj.KeyValues.TryGetValue("targetname", out string? tn)
				? tn : null;

			if (!originGroups.TryGetValue(key, out var group))
			{
				group = new List<(ObjectInfo, string?, string?)>(4);
				originGroups[key] = group;
			}
			group.Add((obj, model, targetName));
			processed.Add(obj.Id);
		}

		var grouped = new List<(Vector3 Origin, string? Model, List<ObjectInfo> Objects)>();
		foreach (var (key, items) in originGroups)
		{
			var typeGroups = items.GroupBy(item => (item.Obj.SpecificType, item.Model, item.TargetName))
								 .Where(g => g.Count() > 1);
			foreach (var group in typeGroups)
			{
				var duplicates = group.Select(item => item.Obj).ToList();
				grouped.Add((duplicates[0].Origin, group.Key.Model, duplicates));
			}
		}

		if (grouped.Count == 0)
		{
			Console.WriteLine("No duplicate origins found.");
		}
		else
		{
			Console.WriteLine($"Found {grouped.Count} sets of duplicates:");
			foreach (var (Origin, Model, Objects) in grouped.OrderByDescending(g => g.Objects.Count))
			{
				Console.WriteLine($"\nDuplicates at origin {Origin}{(Model != null ? $" with model '{Model}'" : "")}:");
				foreach (var obj in Objects)
				{
					string targetNameDisplay = obj.Type == "entity" && obj.KeyValues != null && obj.KeyValues.TryGetValue("targetname", out string? tn)
						? $" (targetname: {tn})"
						: "";
					Console.WriteLine($"  {obj.Type} ({obj.SpecificType}){targetNameDisplay} ID {obj.Id}");
				}
			}

			Console.WriteLine($"\nTotal objects processed: {objects.Count}");
			Console.WriteLine($"Total duplicate sets: {grouped.Count}");
			Console.WriteLine($"Total objects in duplicate sets: {grouped.Sum(g => g.Objects.Count)}");
		}
	}

	static void ReportPropStaticDynamicConflicts(List<ObjectInfo> objects)
	{
		var modelToTypes = new Dictionary<string, HashSet<string>>(objects.Count / 10);
		foreach (var obj in objects)
		{
			if (obj.Type == "entity" && obj.KeyValues != null && obj.KeyValues.TryGetValue("model", out string? model) && model != null)
			{
				if (!modelToTypes.TryGetValue(model, out var types))
				{
					types = new HashSet<string>(2);
					modelToTypes[model] = types;
				}
				types.Add(obj.SpecificType);
			}
		}

		bool foundConflicts = false;
		Console.WriteLine("\nProp Static/Dynamic Conflict Check:");
		foreach (var (model, types) in modelToTypes.OrderBy(kvp => kvp.Key))
		{
			if (types.Contains("prop_static") && types.Contains("prop_dynamic"))
			{
				if (!foundConflicts)
				{
					Console.WriteLine("Models that can be static:");
					foundConflicts = true;
				}
				Console.WriteLine($"Model {model} can (probably) be static!");
			}
		}

		if (!foundConflicts)
		{
			Console.WriteLine("No models found using both prop_static and prop_dynamic.");
		}
	}


	[GeneratedRegex(@"""id""\s*""(\d+)""", RegexOptions.IgnoreCase)]
	private static partial Regex idreg();

	[GeneratedRegex(@"\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)", RegexOptions.IgnoreCase)]
	private static partial Regex planereg();

	[GeneratedRegex(@"""origin""\s*""(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)""", RegexOptions.IgnoreCase)]
	private static partial Regex originreg();

	[GeneratedRegex(@"""([^""]+)""\s*""([^""]*)""", RegexOptions.IgnoreCase)]
	private static partial Regex kvreg();

	[GeneratedRegex(@"side\s*\{.*?\}", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
	private static partial Regex sidereg();

	[GeneratedRegex(@"""material""\s*""([^""]+)""", RegexOptions.IgnoreCase)]
	private static partial Regex matreg();
}
