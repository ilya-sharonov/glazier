interface Cluster extends Electron.Rectangle {
    id: number;
    parentId: number;
    rootId: number;
    matrix: number[][];
    rx: number;
    ry: number;
}

interface ClusterDefinition {
    sourceCluster: Cluster;
    targetCluster: Cluster;
    clusterId: number;
}

function fillMatrix({ width, height, value }: { width: number; height: number; value: number }): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < height; i++) {
        matrix[i] = [];
        matrix[i].fill(value, 0, width);
    }
    return matrix;
}

function mergeMatrix({
    source,
    target,
    sourceX,
    sourceY,
}: {
    source: number[][];
    target: number[][];
    sourceX: number;
    sourceY: number;
}): number[][] {
    for (let i = sourceX; i < source.length; i++) {
        for (let j = sourceY; j < source[i].length; j++) {
            target[i][j] = source[i][j];
        }
    }
    return target;
}

export function defineCluster({ sourceCluster, targetCluster, clusterId }: ClusterDefinition): Cluster {
    const { x: sourceX, y: sourceY, rx: sourceRx, ry: sourceRy, matrix: sourceMatrix } = sourceCluster;
    const { x: targetX, y: targetY, rx: targetRx, ry: targetRy, matrix: targetMatrix } = targetCluster;
    const x = sourceX < targetX ? sourceX : targetX;
    const y = sourceY < targetY ? sourceY : targetY;
    const width = sourceRx > targetRx ? sourceRx - x : targetRx - x;
    const height = sourceRy > targetRy ? sourceRy - y : targetRy - y;
    const rx = x + width;
    const ry = y + height;
    const matrix = fillMatrix({
        width,
        height,
        value: clusterId,
    });
    mergeMatrix({
        source: sourceMatrix,
        target: matrix,
        sourceX,
        sourceY,
    });
    mergeMatrix({
        source: targetMatrix,
        target: matrix,
        sourceX: targetX,
        sourceY: targetY,
    });
    sourceCluster.parentId = clusterId;
    sourceCluster.rootId = clusterId;
    targetCluster.parentId = clusterId;
    targetCluster.rootId = clusterId;
    return {
        id: clusterId,
        parentId: clusterId,
        rootId: clusterId,
        matrix,
        x,
        y,
        width,
        height,
        rx,
        ry,
    };
}
