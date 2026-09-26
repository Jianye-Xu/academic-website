export const publicationTypes = ['all', 'selected', 'peer-reviewed', 'preprint'];
export const researchAreas = ['all', 'MARL', 'Safe Control', 'CAVs', 'Robotics'];

export function matchesPublication(publication, type, area) {
  const matchesType = type === 'all' || (type === 'selected' ? publication.selected : publication.status === type);
  return matchesType && (area === 'all' || publication.tags.includes(area));
}

export function readFilters(search) {
  const params = new URLSearchParams(search);
  return {
    type: publicationTypes.includes(params.get('type')) ? params.get('type') : 'all',
    area: researchAreas.includes(params.get('area')) ? params.get('area') : 'all',
  };
}
