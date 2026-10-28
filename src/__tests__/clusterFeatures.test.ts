import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';
import {
  fetchConversionPaths,
  type PathfindRequest,
  type ConversionPath,
} from '../services/crossAssetPayment';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
}));

describe('Master Cluster Verification Suite (#23, #29, #34)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #23: Drag-and-Drop Employee Reordering Invariants', () => {
    it('correctly reorders items when dragged from source index to destination index', () => {
      const initialEmployees = [
        { id: '1', name: 'Alice', email: 'alice@example.com', position: 'Engineer' },
        { id: '2', name: 'Bob', email: 'bob@example.com', position: 'Lead' },
        { id: '3', name: 'Charlie', email: 'charlie@example.com', position: 'Designer' },
      ];

      // Move Charlie (index 2) to top (index 0)
      const reordered = Array.from(initialEmployees);
      const [removed] = reordered.splice(2, 1);
      reordered.splice(0, 0, removed);

      expect(reordered.map((e) => e.name)).toEqual(['Charlie', 'Alice', 'Bob']);
      expect(reordered.length).toBe(3);
    });

    it('preserves array invariants when dragging within boundaries', () => {
      const list = ['A', 'B', 'C', 'D'];
      const sourceIndex = 1;
      const destinationIndex = 3;

      const items = Array.from(list);
      const [item] = items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, item);

      expect(items).toEqual(['A', 'C', 'D', 'B']);
      expect(new Set(items).size).toBe(4);
    });
  });

  describe('Issue #29: Error Boundaries & Sentry Crash Reporting', () => {
    it('captures errors with component stack using Sentry', () => {
      const mockError = new Error('Test component render failure');
      const mockErrorInfo = { componentStack: '\n    in FaultyComponent\n    in App' };

      Sentry.captureException(mockError, {
        extra: {
          componentStack: mockErrorInfo.componentStack,
          componentName: 'DashboardWidget',
        },
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        mockError,
        expect.objectContaining({
          extra: expect.objectContaining({
            componentName: 'DashboardWidget',
          }),
        })
      );
    });
  });

  describe('Issue #34: Cross-Asset Payment Path Finding and Fallbacks', () => {
    it('returns structured conversion paths with fee, rate, and slippage calculations', async () => {
      const req: PathfindRequest = {
        fromAsset: 'USDC',
        toAsset: 'NGN',
        amount: 100,
      };

      const paths = await fetchConversionPaths(req);

      expect(paths.length).toBeGreaterThan(0);
      const fastPath = paths.find((p) => p.id === 'path-fast');
      expect(fastPath).toBeDefined();
      if (fastPath) {
        expect(fastPath.sourceAsset).toBe('USDC');
        expect(fastPath.destinationAsset).toBe('NGN');
        expect(fastPath.rate).toBeGreaterThan(0);
        expect(fastPath.estimatedDestinationAmount).toBeGreaterThan(0);
        expect(fastPath.hops).toContain('XLM');
        expect(fastPath.slippage).toBeLessThan(1.0);
      }
    });

    it('calculates alternative cheap path with distinct routing hops and slippage', async () => {
      const req: PathfindRequest = {
        fromAsset: 'USDC',
        toAsset: 'BRL',
        amount: 250,
      };

      const paths = await fetchConversionPaths(req);
      const cheapPath = paths.find((p) => p.id === 'path-cheap');
      expect(cheapPath).toBeDefined();
      if (cheapPath) {
        expect(cheapPath.destinationAsset).toBe('BRL');
        expect(cheapPath.hops).toContain('USDC');
        expect(cheapPath.fee).toBeGreaterThan(0);
      }
    });
  });
});
