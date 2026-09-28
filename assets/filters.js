export const publicationTypes = ['all', 'selected'];
export const publicationTags = ['all', 'Learning', 'Safe Control', 'CAVs'];

export function matchesPublication(publication, type, tag) {
  const matchesType = type === 'all' || (type === 'selected' && publication.selected);
  return matchesType && (tag === 'all' || publication.tags.includes(tag));
}

export function readFilters(search) {
  const params = new URLSearchParams(search);
  // Preserve shared links from before the tag rename.
  const previousTag = params.get('tag') ?? params.get('area');
  const tag = previousTag === 'MARL' ? 'Learning' : previousTag;
  return {
    type: publicationTypes.includes(params.get('type')) ? params.get('type') : 'all',
    tag: publicationTags.includes(tag) ? tag : 'all',
  };
}
