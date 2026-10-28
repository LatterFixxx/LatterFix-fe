import React, { useState, useEffect, useTransition } from 'react';
import {
  ArrowLeftRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet,
  Coins,
} from 'lucide-react';
import {
  fetchConversionPaths,
  submitCrossAssetPayment,
  type ConversionPath,
} from '../services/crossAssetPayment';
import { useWallet } from '../hooks/useWallet';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../hooks/useNotification';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';

const SUPPORTED_SOURCE_ASSETS = ['USDC', 'EURT', 'XLM'];
const SUPPORTED_DEST_ASSETS = ['NGN', 'BRL', 'ARS', 'KES', 'EURT', 'USDC'];

export const CrossAssetPayment: React.FC = () => {
  const { address, signTransaction, connect } = useWallet();
  const { subscribeToTransaction, unsubscribeFromTransaction, socket, connected: socketConnected } =
    useSocket();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  const [fromAsset, setFromAsset] = useState<string>('USDC');
  const [toAsset, setToAsset] = useState<string>('NGN');
  const [amount, setAmount] = useState<string>('100');
  const [receiver, setReceiver] = useState<string>('');

  const [paths, setPaths] = useState<ConversionPath[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Status lifecycle: idle -> simulating -> signing -> submitted -> confirmed | failed
  const [submissionStep, setSubmissionStep] = useState<
    'idle' | 'simulating' | 'signing' | 'submitted' | 'confirmed' | 'failed'
  >('idle');
  const [submittedTxHash, setSubmittedTxHash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // 1. Debounced Path-finding on asset or amount change
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || fromAsset === toAsset) {
      setPaths([]);
      setSelectedPathId('');
      return;
    }

    setIsLoadingPaths(true);
    const timer = setTimeout(async () => {
      try {
        const found = await fetchConversionPaths({
          fromAsset,
          toAsset,
          amount: numAmount,
        });

        startTransition(() => {
          setPaths(found);
          if (found.length > 0) {
            setSelectedPathId(found[0].id);
          } else {
            setSelectedPathId('');
          }
        });
      } catch (err) {
        console.warn('Failed to fetch conversion paths:', err);
      } finally {
        setIsLoadingPaths(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [fromAsset, toAsset, amount]);

  // 2. Real-time updates via SocketProvider
  useEffect(() => {
    if (!submittedTxHash || !socket) return;

    subscribeToTransaction(submittedTxHash);

    const handleTxUpdate = (data: { transactionId?: string; status?: string; message?: string }) => {
      if (data.transactionId && data.transactionId !== submittedTxHash) return;

      if (data.status === 'confirmed' || data.status === 'SUCCESS') {
        setSubmissionStep('confirmed');
        setStatusMessage(data.message || 'Payment successfully settled on-chain via Soroban!');
        notifySuccess('Cross-asset payment confirmed on Stellar!');
      } else if (data.status === 'failed' || data.status === 'ERROR') {
        setSubmissionStep('failed');
        setStatusMessage(data.message || 'On-chain payment execution failed.');
        notifyError('Transaction failed during contract execution.');
      } else if (data.status) {
        setStatusMessage(data.message || `Status update: ${data.status}`);
      }
    };

    socket.on('transaction:update', handleTxUpdate);
    socket.on('transaction:status', handleTxUpdate);

    return () => {
      unsubscribeFromTransaction(submittedTxHash);
      socket.off('transaction:update', handleTxUpdate);
      socket.off('transaction:status', handleTxUpdate);
    };
  }, [submittedTxHash, socket, subscribeToTransaction, unsubscribeFromTransaction, notifySuccess, notifyError]);

  const selectedPath = paths.find((p) => p.id === selectedPathId) || paths[0];

  // 3. Execution flow
  const handleExecutePayment = async () => {
    if (!address) {
      notifyWarning('Please connect your Stellar wallet first.');
      await connect();
      return;
    }

    if (!receiver || receiver.trim().length < 20) {
      notifyError('Please enter a valid Stellar destination address.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      notifyError('Please enter a valid amount.');
      return;
    }

    if (!selectedPath) {
      notifyError('No conversion path available for this asset pair.');
      return;
    }

    const contractId =
      (import.meta.env.PUBLIC_CROSS_ASSET_CONTRACT_ID as string | undefined) ||
      'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZLKERYNZLKERYNZLKER7';

    try {
      setIsSubmitting(true);
      setSubmissionStep('simulating');
      setStatusMessage('Simulating Soroban transaction...');

      setSubmissionStep('signing');
      setStatusMessage('Awaiting wallet signature...');

      const result = await submitCrossAssetPayment({
        contractId,
        sourceAddress: address,
        signTransaction,
        amount: numAmount,
        fromAsset,
        toAsset,
        receiver: receiver.trim(),
        selectedPathId: selectedPath.id,
      });

      setSubmittedTxHash(result.txHash);
      setSubmissionStep('submitted');
      setStatusMessage(`Transaction submitted: ${result.txHash.slice(0, 8)}...${result.txHash.slice(-8)}`);
      notifySuccess('Payment submitted to the Stellar network!');
    } catch (err) {
      setSubmissionStep('failed');
      const errStr = err instanceof Error ? err.message : String(err);
      setStatusMessage(errStr);
      notifyError(`Payment failed: ${errStr}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cross-Asset Payment Integration</h1>
            <p className="text-sm text-muted">
              Live Stellar path-finding &amp; Soroban contract settlement with automated slippage protection
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters Panel */}
        <div className="lg:col-span-2 space-y-6">
          <ComponentErrorBoundary componentName="AssetPairSelector">
            <div className="card glass noise p-6 space-y-5 rounded-2xl border border-white/10">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-accent" />
                Asset &amp; Amount Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Source Asset (You Pay)
                  </label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                    value={fromAsset}
                    onChange={(e) => setFromAsset(e.target.value)}
                  >
                    {SUPPORTED_SOURCE_ASSETS.map((asset) => (
                      <option key={asset} value={asset} className="bg-bg text-white">
                        {asset}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Destination Asset (Recipient Receives)
                  </label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                    value={toAsset}
                    onChange={(e) => setToAsset(e.target.value)}
                  >
                    {SUPPORTED_DEST_ASSETS.map((asset) => (
                      <option key={asset} value={asset} className="bg-bg text-white">
                        {asset}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Payment Amount ({fromAsset})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 100"
                  />
                  {isLoadingPaths && (
                    <div className="absolute right-3 top-2.5 text-accent animate-spin">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Destination Recipient Address
                </label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="G... (Stellar public key)"
                />
              </div>
            </div>
          </ComponentErrorBoundary>

          {/* Available Conversion Paths */}
          <ComponentErrorBoundary componentName="ConversionPathsList">
            <div className="card glass noise p-6 space-y-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Available Conversion Paths
                </h2>
                <span className="text-xs text-muted">
                  {paths.length} {paths.length === 1 ? 'path found' : 'paths found'}
                </span>
              </div>

              {isLoadingPaths ? (
                <div className="flex items-center justify-center p-8 text-muted gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  Discovering optimal Stellar conversion paths...
                </div>
              ) : paths.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm border border-dashed border-white/10 rounded-xl">
                  No liquidity paths discovered for {fromAsset} &rarr; {toAsset}. Try adjusting the amount.
                </div>
              ) : (
                <div className="space-y-3">
                  {paths.map((path) => {
                    const isSelected = selectedPath?.id === path.id;
                    return (
                      <div
                        key={path.id}
                        onClick={() => setSelectedPathId(path.id)}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border-accent shadow-md shadow-accent/5'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              1 {path.sourceAsset} = {path.rate} {path.destinationAsset}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-muted font-mono">
                              {path.hops.join(' → ')}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-accent">
                            ~{path.estimatedDestinationAmount.toLocaleString()} {path.destinationAsset}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>Fee: {path.fee} {path.sourceAsset}</span>
                          <span>Max Slippage: {path.slippage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ComponentErrorBoundary>
        </div>

        {/* Settlement Preview & Submission Sidebar */}
        <div className="space-y-6">
          <ComponentErrorBoundary componentName="SettlementPreview">
            <div className="card glass noise p-6 space-y-5 rounded-2xl border border-white/10">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Settlement Preview
              </h2>

              <div className="space-y-3 text-sm divide-y divide-white/5 font-mono">
                <div className="flex justify-between pt-2">
                  <span className="text-muted">Pay Amount</span>
                  <span className="font-semibold text-white">
                    {amount || '0'} {fromAsset}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted">Estimated Delivery</span>
                  <span className="font-semibold text-accent">
                    {selectedPath?.estimatedDestinationAmount.toLocaleString() || '0'} {toAsset}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted">Network Fee</span>
                  <span className="text-white">
                    {selectedPath?.fee || '0'} {fromAsset}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted">Slippage Tolerance</span>
                  <span className="text-white">{selectedPath?.slippage || 0.5}%</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted">Real-time Stream</span>
                  <span className={`text-xs ${socketConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    {socketConnected ? 'Connected' : 'Polling'}
                  </span>
                </div>
              </div>

              {/* Status Stepper */}
              {submissionStep !== 'idle' && (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {submissionStep === 'simulating' || submissionStep === 'signing' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    ) : submissionStep === 'confirmed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : submissionStep === 'failed' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-accent" />
                    )}
                    <span className="uppercase tracking-wider font-mono text-[11px]">
                      {submissionStep}
                    </span>
                  </div>
                  <p className="text-xs text-muted break-words">{statusMessage}</p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleExecutePayment}
                disabled={isSubmitting || !selectedPath}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-accent text-bg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-accent/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Settlement...
                  </>
                ) : !address ? (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet to Pay
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Submit Cross-Asset Payment
                  </>
                )}
              </button>
            </div>
          </ComponentErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default CrossAssetPayment;
