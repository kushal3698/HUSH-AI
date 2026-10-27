import React from 'react';
import { Gamepad2, Trophy } from 'lucide-react';
import { MiniGameData } from '../types';

interface MiniGameCardProps {
  game: MiniGameData;
  isMe?: boolean;
  currentUserId: string;
  onVote: (gameId: string, choice: string) => void;
}

export const MiniGameCard: React.FC<MiniGameCardProps> = ({
  game,
  currentUserId,
  onVote
}) => {
  const myVote = game.votes?.[currentUserId];
  const hasVoted = Boolean(myVote);
  const totalVotes = Object.keys(game.votes || {}).length;

  // For Would You Rather
  if (game.type === 'would_you_rather') {
    const votesA = Object.values(game.votes || {}).filter(v => v === 'A').length;
    const votesB = Object.values(game.votes || {}).filter(v => v === 'B').length;
    const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
    const percentB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 50;

    return (
      <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/90 border border-purple-500/40 p-4 shadow-xl space-y-3 animate-fade-in my-1">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
          <div className="flex items-center space-x-1.5 text-purple-300">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Mini-Game: Would You Rather?</span>
          </div>
          <span className="text-[10px] text-purple-200/70 font-mono">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        <p className="text-xs font-semibold text-white">
          {game.question}
        </p>

        <div className="space-y-2">
          {/* Option A */}
          <button
            onClick={() => onVote(game.id, 'A')}
            className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
              myVote === 'A'
                ? 'bg-purple-900/60 border-purple-400 text-white ring-1 ring-purple-400 shadow-md'
                : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-700/70 text-slate-200'
            }`}
          >
            {hasVoted && (
              <div 
                className="absolute top-0 bottom-0 left-0 bg-purple-600/25 transition-all duration-500" 
                style={{ width: `${percentA}%` }}
              />
            )}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-medium pr-2">🅰️ {game.optionA}</span>
              {hasVoted && (
                <span className="text-xs font-bold text-purple-300 font-mono flex-shrink-0">
                  {percentA}%
                </span>
              )}
            </div>
          </button>

          {/* Option B */}
          <button
            onClick={() => onVote(game.id, 'B')}
            className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
              myVote === 'B'
                ? 'bg-cyan-900/60 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-md'
                : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-700/70 text-slate-200'
            }`}
          >
            {hasVoted && (
              <div 
                className="absolute top-0 bottom-0 left-0 bg-cyan-600/25 transition-all duration-500" 
                style={{ width: `${percentB}%` }}
              />
            )}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-medium pr-2">🅱️ {game.optionB}</span>
              {hasVoted && (
                <span className="text-xs font-bold text-cyan-300 font-mono flex-shrink-0">
                  {percentB}%
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="text-[10px] text-slate-400 text-center pt-1">
          {!hasVoted ? "Tap an option to cast your anonymous vote!" : "Both players can vote to see the match comparison!"}
        </div>
      </div>
    );
  }

  // Two Truths and a Lie
  if (game.type === 'two_truths_lie' && game.statements) {
    const guessedIndex = myVote ? parseInt(myVote, 10) : null;
    const isCorrect = guessedIndex !== null && guessedIndex === game.lieIndex;

    return (
      <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/90 border border-indigo-500/40 p-4 shadow-xl space-y-3 animate-fade-in my-1">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
          <div className="flex items-center space-x-1.5 text-indigo-300">
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Two Truths & A Lie</span>
          </div>
          <span className="text-[10px] text-indigo-200/70">
            {hasVoted ? "Revealed" : "Guess the Lie"}
          </span>
        </div>

        <p className="text-xs font-semibold text-white">
          {game.question}
        </p>

        <div className="space-y-2">
          {game.statements.map((stmt, idx) => {
            const isLie = idx === game.lieIndex;
            const isSelected = guessedIndex === idx;

            let badgeClass = "bg-slate-900/70 hover:bg-slate-800/80 border-slate-700/70 text-slate-200";
            if (hasVoted) {
              if (isLie) {
                badgeClass = "bg-rose-950/70 border-rose-500 text-rose-200 font-semibold ring-1 ring-rose-500";
              } else if (isSelected) {
                badgeClass = "bg-slate-800 border-slate-600 text-slate-300 line-through opacity-70";
              }
            }

            return (
              <button
                key={idx}
                disabled={hasVoted}
                onClick={() => onVote(game.id, idx.toString())}
                className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex items-center justify-between ${badgeClass}`}
              >
                <span>{idx + 1}. {stmt}</span>
                {hasVoted && isLie && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white ml-2 flex-shrink-0">
                    THE LIE! ❌
                  </span>
                )}
                {hasVoted && !isLie && isSelected && (
                  <span className="text-[10px] font-medium text-slate-400 ml-2 flex-shrink-0">
                    Truth ✅
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {hasVoted && (
          <div className={`p-2.5 rounded-xl text-xs text-center font-bold flex items-center justify-center space-x-1.5 ${
            isCorrect ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' : 'bg-slate-800 text-slate-300'
          }`}>
            {isCorrect ? (
              <>
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Boom! You spotted the lie correctly! 🎉</span>
              </>
            ) : (
              <span>Nice try! The lie was statement #{ (game.lieIndex || 0) + 1 }.</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};
