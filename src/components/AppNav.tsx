import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  ShieldCheck,
  History,
  Coins,
  Menu,
  X,
  UserCheck,
  Wifi,
  WifiOff,
  Zap,
  ExternalLink,
  UserCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import { useTaskStore } from '../services/taskStore';
import { useWallet } from '../hooks/useWallet';
import { useHorizonAccount } from '../hooks/useHorizonAccount';
import { getExplorerUrl } from '../services/stellar';
import { fetchNetworkFeeStats, type NetworkFeeStats } from '../services/transactionHistory';

const AppNav: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, updateProfile } = useTaskStore();
  const { address, connect, disconnect, isConnecting } = useWallet();
  const { balances, isLoading: balancesLoading } = useHorizonAccount(address);
  const [feeStats, setFeeStats] = useState<NetworkFeeStats | null>(null);

  // Fetch live network fee stats on mount and every 60s
  useEffect(() => {
    const load = () =>
      fetchNetworkFeeStats()
        .then(setFeeStats)
        .catch(() => null);
    void load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (role: 'Creator' | 'Contributor' | 'Admin') => {
    let name = 'LatterFixer';
    let addr = 'G-CONTRIB-Alice-888';
    if (role === 'Creator') {
      name = 'LatterFix-Creator';
      addr = 'G-CREATOR-LatterFix-777';
    } else if (role === 'Admin') {
      name = 'LatterFix-Admin';
      addr = 'G-CREATOR-Admin-111';
    }
    updateProfile(name, addr, role);
  };

  const congestionDot =
    feeStats?.congestion === 'low'
      ? 'bg-green-400'
      : feeStats?.congestion === 'moderate'
      ? 'bg-yellow-400'
      : feeStats?.congestion
      ? 'bg-red-400'
      : 'bg-white/20';

  const navLinks = (
    <>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-(--accent) bg-white/5 shadow-sm shadow-accent/5'
              : 'text-(--muted) hover:bg-white/10 hover:text-white'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-(--accent) bg-white/5'
              : 'text-(--muted) hover:bg-white/10 hover:text-white'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <Search className="w-4 h-4" />
        <span>Task Explorer</span>
      </NavLink>

      <NavLink
        to="/create-task"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-(--accent) bg-white/5'
              : 'text-(--muted) hover:bg-white/10 hover:text-white'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <PlusCircle className="w-4 h-4" />
        <span>Create Task</span>
      </NavLink>

      <NavLink
        to="/escrow"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-(--accent) bg-white/5'
              : 'text-(--muted) hover:bg-white/10 hover:text-white'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <Coins className="w-4 h-4" />
        <span>Escrow &amp; Disputes</span>
      </NavLink>

      <NavLink
        to="/history"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-(--accent) bg-white/5'
              : 'text-(--muted) hover:bg-white/10 hover:text-white'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <History className="w-4 h-4" />
        <span>History</span>
      </NavLink>

      <NavLink
        to="/cross-asset-payment"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-(--accent) bg-white/5'
              : 'text-(--muted) hover:bg-white/10 hover:text-white'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <ArrowLeftRight className="w-4 h-4" />
        <span>Cross-Asset</span>
      </NavLink>

      <NavLink
        to="/governance"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-purple-400 bg-purple-500/10'
              : 'text-purple-300 hover:bg-purple-500/20 hover:text-purple-400'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>Governance</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
            isActive
              ? 'text-(--accent) bg-white/5'
              : 'text-(--muted) hover:bg-white/10 hover:text-white'
          }`
        }
        onClick={() => setMobileOpen(false)}
      >
        <UserCircle2 className="w-4 h-4" />
        <span>Profile</span>
      </NavLink>
    </>
  );

  return (
    <nav className="relative w-full flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-4">{navLinks}</div>

        {/* Mobile menu button */}
        <button
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-white/5 transition"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Right side: Network pill + wallet + role */}
      <div className="ml-auto flex items-center gap-2">

        {/* Live network congestion indicator */}
        {feeStats && (
          <div
            title={`Stellar Testnet — ${feeStats.congestion} congestion | Base: ${feeStats.baseFee} stroops | Ledger #${feeStats.lastLedger.toLocaleString()}`}
            className="hidden md:flex items-center gap-1.5 bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/5 cursor-default"
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${congestionDot}`} />
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted">
              {feeStats.congestion}
            </span>
            <span className="text-[9px] font-mono text-white/30">
              {feeStats.baseFee}s
            </span>
          </div>
        )}

        {/* Wallet connect / status */}
        {address ? (
          <div className="hidden md:flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-xl border border-green-500/20">
            <Wifi className="w-3 h-3 text-green-400 shrink-0" />
            <div className="text-left">
              <a
                href={getExplorerUrl('account', address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-green-400 hover:underline flex items-center gap-0.5 leading-none"
              >
                {address.slice(0, 5)}...{address.slice(-4)}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <p className="text-[9px] text-muted mt-0.5 leading-none">
                {balancesLoading
                  ? '...'
                  : `${parseFloat(balances.XLM).toFixed(2)} XLM`}
              </p>
            </div>
            <button
              onClick={disconnect}
              title="Disconnect wallet"
              className="text-[9px] text-red-400/60 hover:text-red-400 ml-1 transition"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-xl text-[11px] font-bold hover:bg-accent/20 transition disabled:opacity-50"
          >
            {isConnecting ? (
              <span className="w-3 h-3 rounded-full border border-accent/50 border-t-accent animate-spin" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        )}

        {/* Role Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-black/35 px-2.5 py-1.5 rounded-xl border border-white/5">
          <UserCheck className="w-3.5 h-3.5 text-accent opacity-75" />
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted mr-1">Role:</span>
          <select
            value={currentUser.role}
            onChange={(e) => handleRoleChange(e.target.value as 'Creator' | 'Contributor' | 'Admin')}
            className="bg-transparent text-[11px] font-bold text-white focus:outline-none cursor-pointer pr-1 border-0"
          >
            <option value="Contributor" className="bg-slate-900 text-white">Contributor</option>
            <option value="Creator" className="bg-slate-900 text-white">Creator</option>
            <option value="Admin" className="bg-slate-900 text-white">Admin</option>
          </select>
        </div>

        {/* Profile card */}
        <div className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-linear-to-tr from-accent to-accent2 flex items-center justify-center font-black text-[10px] text-black">
            {currentUser.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[10px] font-extrabold text-white leading-none mb-0.5">
              {currentUser.username}
            </p>
            <p className="text-[9px] font-mono text-muted leading-none flex items-center gap-1">
              {address ? (
                <span className="text-green-400">● on-chain</span>
              ) : (
                <span>{currentUser.address.slice(0, 6)}...{currentUser.address.slice(-4)}</span>
              )}
            </p>
          </div>
        </div>

        {/* Mobile wallet quick-connect */}
        {!address && (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="md:hidden p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition disabled:opacity-50"
            title="Connect wallet"
          >
            <Zap className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden absolute left-0 right-0 top-full z-40 bg-slate-900 border border-white/5 shadow-2xl rounded-xl mt-2 overflow-hidden">
          <div className="px-4 py-3 flex flex-col gap-2 bg-slate-950">
            {navLinks}

            {/* Mobile wallet section */}
            <div className="border-t border-white/5 my-2 pt-3 space-y-2">
              {address ? (
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono text-green-400">{address.slice(0, 8)}...{address.slice(-4)}</p>
                    <p className="text-muted text-[10px]">
                      {balancesLoading ? 'Loading...' : `${parseFloat(balances.XLM).toFixed(4)} XLM`}
                    </p>
                  </div>
                  <button
                    onClick={() => { disconnect(); setMobileOpen(false); }}
                    className="text-red-400 text-[11px] font-bold border border-red-500/20 px-2 py-1 rounded-lg"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { void connect(); setMobileOpen(false); }}
                  className="w-full py-2 bg-accent text-bg font-bold rounded-lg text-xs"
                >
                  Connect Wallet
                </button>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Role:</span>
                <select
                  value={currentUser.role}
                  onChange={(e) => {
                    handleRoleChange(e.target.value as 'Creator' | 'Contributor' | 'Admin');
                    setMobileOpen(false);
                  }}
                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="Contributor">Contributor</option>
                  <option value="Creator">Creator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {feeStats && (
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <span className={`w-1.5 h-1.5 rounded-full ${congestionDot}`} />
                  Stellar Testnet — {feeStats.congestion} congestion | Ledger #{feeStats.lastLedger.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AppNav;
