/**
 * System Design Architecture Engine
 * Architecture node models, connection line state reducers, and topology validation algorithms.
 */

export interface ArchitectureNode {
    id: string;
    type: 'client' | 'load_balancer' | 'api_gateway' | 'microservice' | 'cache' | 'database' | 'queue';
    label: string;
    x: number;
    y: number;
    status: 'healthy' | 'degraded';
}

export interface ArchitectureConnection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    protocol: 'HTTPS' | 'gRPC' | 'TCP' | 'AMQP';
}

export const INITIAL_CANVAS_NODES: ArchitectureNode[] = [
    { id: "node_1", type: "client", label: "Web / Mobile Client", x: 40, y: 120, status: "healthy" },
    { id: "node_2", type: "load_balancer", label: "NGINX Load Balancer", x: 220, y: 120, status: "healthy" },
    { id: "node_3", type: "api_gateway", label: "Kong API Gateway", x: 400, y: 120, status: "healthy" },
    { id: "node_4", type: "microservice", label: "Auth Microservice", x: 580, y: 60, status: "healthy" },
    { id: "node_5", type: "microservice", label: "Payment Service", x: 580, y: 180, status: "healthy" },
    { id: "node_6", type: "cache", label: "Redis Cluster (Cache)", x: 760, y: 60, status: "healthy" },
    { id: "node_7", type: "database", label: "PostgreSQL Primary DB", x: 760, y: 180, status: "healthy" }
];

export const INITIAL_CONNECTIONS: ArchitectureConnection[] = [
    { id: "conn_1", fromNodeId: "node_1", toNodeId: "node_2", protocol: "HTTPS" },
    { id: "conn_2", fromNodeId: "node_2", toNodeId: "node_3", protocol: "HTTPS" },
    { id: "conn_3", fromNodeId: "node_3", toNodeId: "node_4", protocol: "gRPC" },
    { id: "conn_4", fromNodeId: "node_3", toNodeId: "node_5", protocol: "gRPC" },
    { id: "conn_5", fromNodeId: "node_4", toNodeId: "node_6", protocol: "TCP" },
    { id: "conn_6", fromNodeId: "node_5", toNodeId: "node_7", protocol: "TCP" }
];
