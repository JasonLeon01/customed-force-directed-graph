export async function getHierarchicalData (fileName) {
	var data = await d3.json('UserData/' + fileName)
	return data
}