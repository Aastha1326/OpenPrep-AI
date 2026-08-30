/**
 * @fileoverview Hierarchical mind-mapping tree component with auto-layout and flashcard export.
 */
import React, { useState } from 'react';

const MindMapEngine = ({ socket, squadId }) => {
    const [nodes, setNodes] = useState([
        { id: 'root', label: 'Central Topic', x: 400, y: 50, children: [] }
    ]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [newNodeLabel, setNewNodeLabel] = useState('');

    const addNode = () => {
        if (!selectedNode || !newNodeLabel.trim()) return;

        const newNode = {
            id: `node_${Date.now()}`,
            label: newNodeLabel.trim(),
            x: selectedNode.x + 150,
            y: selectedNode.y + (selectedNode.children.length * 60),
            children: []
        };

        const updatedNodes = JSON.parse(JSON.stringify(nodes));
        const findAndUpdate = (list) => {
            for (let node of list) {
                if (node.id === selectedNode.id) {
                    node.children.push(newNode);
                    return true;
                }
                if (node.children.length > 0 && findAndUpdate(node.children)) return true;
            }
            return false;
        };

        findAndUpdate(updatedNodes);
        setNodes(updatedNodes);
        setNewNodeLabel('');

        if (socket && squadId) {
            socket.emit('whiteboard:mindmap-update', { type: 'add_node', payload: newNode, parentId: selectedNode.id });
        }
    };

    const exportToFlashcards = () => {
        // Mock export logic
        const flashcards = [];
        const traverse = (nodeList) => {
            nodeList.forEach(node => {
                if (node.id !== 'root' && node.label) {
                    flashcards.push({ front: `Explain: ${node.label}`, back: `Details about ${node.label}` });
                }
                if (node.children) traverse(node.children);
            });
        };
        traverse(nodes);
        alert(`Exported ${flashcards.length} flashcards to your deck!`);
    };

    const renderTree = (nodeList, depth = 0) => {
        return (
            <div className="flex flex-col items-center">
                {nodeList.map((node) => (
                    <div key={node.id} className="flex flex-col items-center my-2">
                        <div
                            onClick={() => setSelectedNode(node)}
                            className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all shadow-sm ${selectedNode?.id === node.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-blue-300'
                                }`}
                        >
                            {node.label}
                        </div>
                        {node.children && node.children.length > 0 && (
                            <div className="flex flex-row gap-4 mt-4 relative">
                                {/* Connector Line */}
                                <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                {renderTree(node.children, depth + 1)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white">Mind Map</h3>
                <button
                    onClick={exportToFlashcards}
                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    Export to Flashcards
                </button>
            </div>

            <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
                {renderTree(nodes)}
            </div>

            {selectedNode && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl flex gap-2">
                    <input
                        type="text"
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        placeholder="New subtopic..."
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && addNode()}
                    />
                    <button
                        onClick={addNode}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Add Node
                    </button>
                </div>
            )}
        </div>
    );
};

export default MindMapEngine;
