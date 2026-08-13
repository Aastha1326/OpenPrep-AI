const { buildTree } = require('../../controllers/folderController');

describe('folderController - buildTree', () => {
  it('should build a nested tree structure correctly', () => {
    const folders = [
      { id: '1', name: 'Root 1', parentId: null, toJSON: function() { return { id: this.id, name: this.name, parentId: this.parentId }; } },
      { id: '2', name: 'Child 1', parentId: '1', toJSON: function() { return { id: this.id, name: this.name, parentId: this.parentId }; } },
      { id: '3', name: 'Root 2', parentId: null, toJSON: function() { return { id: this.id, name: this.name, parentId: this.parentId }; } },
      { id: '4', name: 'Grandchild 1', parentId: '2', toJSON: function() { return { id: this.id, name: this.name, parentId: this.parentId }; } },
    ];

    const tree = buildTree(folders, null);

    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe('Root 1');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Child 1');
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].name).toBe('Grandchild 1');
    expect(tree[1].name).toBe('Root 2');
    expect(tree[1].children).toHaveLength(0);
  });

  it('should return empty array if no folders match parentId', () => {
    const tree = buildTree([], null);
    expect(tree).toEqual([]);
  });
});
