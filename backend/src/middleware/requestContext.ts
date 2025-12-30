/**
 * Request Context Middleware
 * 
 * Generates request_id and trace_id for each incoming request.
 * Propagates context through async boundaries using AsyncLocalStorage.
 */

import { Request, Response, NextFunction } from 'express';
import { asyncContext, generateRequestId, generateTraceId, generateSpanId, LogContext } from '../lib/logger';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            traceId: string;
            spanId: string;
            startTime: number;
        }
    }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Generate or extract IDs (support distributed tracing headers)
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    const traceId = req.headers['x-trace-id'] as string || generateTraceId();
    const spanId = generateSpanId();
    
    // Attach to request object
    req.requestId = requestId;
    req.traceId = traceId;
    req.spanId = spanId;
    req.startTime = Date.now();
    
    // Set response headers for tracing
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Trace-ID', traceId);
    
    // Create context for this request
    const context: LogContext = {
        request_id: requestId,
        trace_id: traceId,
        span_id: spanId,
    };
    
    // Run the rest of the request in this context
    asyncContext.run(context, () => {
        next();
    });
}

export default requestContextMiddleware;
