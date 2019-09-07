////////////////////////////////////////////////////////////////////////////////
//   Yen's Algorithmを実装してK shortest path問題を解くスクリプト
////////////////////////////////////////////////////////////////////////////////

const Graph = require('node-dijkstra');

//let console = {
//    log: function() {
//    },
//    error: function(a) {
//
//    }
//}

/**
 * ダイクストラ用のグラフに辺を追加する
 */
function addEdge(graphHash, from, to, cost) {
    console.log(`addEdge: ${from} -> ${to}: ${cost}`);

    if (graphHash[from] == undefined)
        graphHash[from] = {};

    cost = Number(cost);
    if (isNaN(cost)) {
        throw new Error(`Invalid cost [${cost}]`);
    }
    if (cost == 0) {
        cost = 0.1; // コスト0だとnode-dijkstraがエラーになるので
    }
    graphHash[from][to] = Number(cost);
}

function Dijkstra(graphHash, from, to) {
    console.log("Dijkstra", from, to);
    console.log(graphHash);
    let graph = new Graph(graphHash);
    let ret = graph.path(from, to, { cost: true });
    return ret;
}

function YenKSP(graphHash, source, sink, K) {
    var A = [];
    // Determine the shortest path from the source to the sink.
    let shortestPath = Dijkstra(graphHash, source, sink).path;
    if (shortestPath == null) {
        console.log("No shortest path");
        return A;
    }
    A[0] = shortestPath;
    console.log(A);
    // Initialize the set to store the potential kth shortest path.
    var B = [];

    // for k from 1 to K:
    for (let k = 1; k < K; k++) {

        // The spur node ranges from the first node to the next to last node in the previous k-shortest path.
        // for i from 0 to size(A[k − 1]) − 2:
        for (let i = 0; i <= A[k - 1].length - 2; i++) {
            // Spur node is retrieved from the previous k-shortest path, k − 1.
            // spurNode = A[k-1].node(i);
            let spurNode = A[k - 1][i];
            console.log(`[k=${k}] [i=${i}] spurNode = `, spurNode);
            // The sequence of nodes from the source to the spur node of the previous k-shortest path.
            // rootPath = A[k-1].nodes(0, i);
            let rootPath = A[k - 1].slice(0, i + 1);
            console.log(`rootPath = `, rootPath);

            let removedEdges = [];
            let removedNodes = [];
            for (let p of A) {
                if (isEqualPath(rootPath, p.slice(0, i + 1))) {
                    //                 // Remove the links that are part of the previous shortest paths which share the same root path.
                    //                 remove p.edge(i,i + 1) from Graph;
                    if (graphHash[p[i]][p[i + 1]] != undefined) {
                        removedEdges.push({ from: p[i], to: p[i + 1], cost: graphHash[p[i]][p[i + 1]] });
                        removeEdge(graphHash, p[i], p[i + 1]);
                    }
                }
            }

            // for each node rootPathNode in rootPath except spurNode:
            //     remove rootPathNode from Graph;
            for (let rootPathNode of rootPath) {
                if (rootPathNode != spurNode) {
                    removedNodes.push({ key: rootPathNode, value: graphHash[rootPathNode] });
                    removeNode(graphHash, rootPathNode);
                }
            }
            //// Calculate the spur path from the spur node to the sink.
            console.log("spurNode", spurNode);
            console.log("sink", sink);
            let spurPath = Dijkstra(graphHash, spurNode, sink).path;
            console.log('spurPath', spurPath);

            if (spurPath != null) {
                // Entire path is made up of the root path and spur path.
                //         totalPath = rootPath + spurPath;
                let totalPath;
                if (rootPath[rootPath.length - 1] == spurPath[0]) {
                    totalPath = rootPath.concat(spurPath.slice(1));
                } else {
                    throw new Error('not equal');
                }
                // Add the potential k-shortest path to the heap.
                // totalPathがBに既に入っていなければ追加
                // FIXME: 本来はBはヒープ構造にすべきらしいが手抜き
                if (!B.some((path) => path.join(',') == totalPath.join(','))) {
                    B.push(totalPath);
                    console.log('Added to B', totalPath);
                    console.log(B);
                } else {
                    console.log('Already added to B', totalPath);
                    console.log(B);
                }
            } else {
                console.log('spurPath not found');
            }

            // Add back the edges and nodes that were removed from the graph.
            for (let removedEdge of removedEdges) {
                console.log("restoreEdge", removedEdge);
                addEdge(graphHash, removedEdge.from, removedEdge.to, removedEdge.cost);
            }
            //restore nodes in rootPath to Graph;
            for (let removedNode of removedNodes) {
                console.log('restoreNode', removedNode);
                graphHash[removedNode.key] = removedNode.value;
            }
        }

        if (B.length == 0) {
            break;
        }
        console.log("Before sort");
        console.log("B", B);
        console.log(B.map(function(x) { return getPathCost(graphHash, x) }));
        B.sort(function(path1, path2) {
            return getPathCost(graphHash, path1) - getPathCost(graphHash, path2);
        });
        console.log("After sort");
        console.log("B", B);
        A[k] = B[0];
        console.log('Added to A:', A[k]);
        console.log('A:', A);
        B.shift();
    }
    console.log('正常終了');
    return A;
}

function getPathCost(graphHash, path) {
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
        cost += graphHash[path[i]][path[i + 1]];
    }
    return cost;
}

function isEqualPath(p1, p2) {
    if (p1.length != p2.length) {
        return false;
    }
    console.log("p1", p1);
    console.log("p2", p2);
    let ret = p1.every((elm, index) => elm == p2[index]);
    console.log("ret", ret);
    return ret;
}

function removeEdge(graphHash, from, to) {
    delete graphHash[from][to];
    console.log(`removeEdge: ${from} -> ${to}`);
}

function removeNode(graphHash, node) {
    console.log("removeNode", node, graphHash[node]);
    delete graphHash[node];
    for (let from in graphHash) {
        delete graphHash[from][node];
    }
}


// https://en.wikipedia.org/wiki/Yen%27s_algorithm
//
//function YenKSP(Graph, source, sink, K):
//   // Determine the shortest path from the source to the sink.
//   A[0] = Dijkstra(Graph, source, sink);
//   // Initialize the set to store the potential kth shortest path.
//   B = [];
//   
//   for k from 1 to K:
//       // The spur node ranges from the first node to the next to last node in the previous k-shortest path.
//       for i from 0 to size(A[k − 1]) − 2:
//           
//           // Spur node is retrieved from the previous k-shortest path, k − 1.
//           spurNode = A[k-1].node(i);
//           // The sequence of nodes from the source to the spur node of the previous k-shortest path.
//           rootPath = A[k-1].nodes(0, i);
//           
//           for each path p in A:
//               if rootPath == p.nodes(0, i):
//                   // Remove the links that are part of the previous shortest paths which share the same root path.
//                   remove p.edge(i,i + 1) from Graph;
//           
//           for each node rootPathNode in rootPath except spurNode:
//               remove rootPathNode from Graph;
//           
//           // Calculate the spur path from the spur node to the sink.
//           spurPath = Dijkstra(Graph, spurNode, sink);
//           
//           // Entire path is made up of the root path and spur path.
//           totalPath = rootPath + spurPath;
//           // Add the potential k-shortest path to the heap.
//           B.append(totalPath);
//           
//           // Add back the edges and nodes that were removed from the graph.
//           restore edges to Graph;
//           restore nodes in rootPath to Graph;
//                   
//       if B is empty:
//           // This handles the case of there being no spur paths, or no spur paths left.
//           // This could happen if the spur paths have already been exhausted (added to A), 
//           // or there are no spur paths at all - such as when both the source and sink vertices 
//           // lie along a "dead end".
//           break;
//       // Sort the potential k-shortest paths by cost.
//       B.sort();
//       // Add the lowest cost path becomes the k-shortest path.
//       A[k] = B[0];
//       B.pop();
//   
//   return A;


async function main() {
    let graphHash = {};
    addEdge(graphHash, 'C', 'D', 3);
    addEdge(graphHash, 'C', 'E', 2);
    addEdge(graphHash, 'D', 'F', 4);
    addEdge(graphHash, 'E', 'D', 1);
    addEdge(graphHash, 'E', 'F', 2);
    addEdge(graphHash, 'E', 'G', 3);
    addEdge(graphHash, 'F', 'G', 2);
    addEdge(graphHash, 'F', 'H', 1);
    addEdge(graphHash, 'G', 'H', 2);

    //let ret = Dijkstra(graphHash);
    //console.log(ret);

    let ret = YenKSP(graphHash, 'C', 'H', 3);
    console.log('経路:');
    console.log(ret);
}

if (typeof require != 'undefined' && require.main === module) {
    main();
}

module.exports = {
    YenKSP,
};
