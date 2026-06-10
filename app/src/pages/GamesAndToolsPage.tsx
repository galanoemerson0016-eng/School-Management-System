import React, { useState } from 'react';
import { Sparkles, Volume2, Paintbrush, Watch, Ruler, Shuffle, Users, Scale, CircleDollarSign, Dices, Trophy, Layers, HelpCircle, Ticket, Grid } from 'lucide-react';

// Import subcomponents
import { Whiteboard } from '../components/games-tools/Whiteboard';
import { WheelOfNames } from '../components/games-tools/WheelOfNames';
import { NoiseDetection } from '../components/games-tools/NoiseDetection';
import { TimerStopwatch } from '../components/games-tools/TimerStopwatch';
import { Converter } from '../components/games-tools/Converter';
import { BouncingWords } from '../components/games-tools/BouncingWords';
import { GroupYourself } from '../components/games-tools/GroupYourself';
import { TugOfWar } from '../components/games-tools/TugOfWar';
import { CoinFlip } from '../components/games-tools/CoinFlip';
import { DiceRoller } from '../components/games-tools/DiceRoller';
import { Scoreboard } from '../components/games-tools/Scoreboard';
import { Flashcards } from '../components/games-tools/Flashcards';
import { Soundboard } from '../components/games-tools/Soundboard';
import { WordSearch } from '../components/games-tools/WordSearch';
import { RaffleJar } from '../components/games-tools/RaffleJar';
import { RandomGroupings } from '../components/games-tools/RandomGroupings';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;
  color: string;
  bgColor: string;
  component: React.ComponentType<{ onBack: () => void }>;
}

export function GamesAndToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools: ToolItem[] = [
    {
      id: 'whiteboard',
      title: 'Whiteboard',
      description: 'Draw ideas, diagrams, and notes. Export as PNG when done.',
      icon: Paintbrush,
      color: '#111827',
      bgColor: '#F3F4F6',
      component: Whiteboard,
    },
    {
      id: 'wheel-of-names',
      title: 'Wheel of Names',
      description: 'Spin a colorful wheel to randomly select a name from your list. Great for recitation, group assignments, or classroom picks.',
      icon: Sparkles,
      color: '#FCB932',
      bgColor: '#FFFBE6',
      component: WheelOfNames,
    },
    {
      id: 'noise-detection',
      title: 'Noise Detection',
      description: 'Monitor classroom sound levels using the built-in microphone. Provides real-time visual feedback to encourage students to stay quiet.',
      icon: Volume2,
      color: '#0A4F8C',
      bgColor: '#EFF6FF',
      component: NoiseDetection,
    },
    {
      id: 'timer-stopwatch',
      title: 'Timer & Stopwatch',
      description: 'Track time with a stopwatch or set a countdown timer. Great for classroom activities, quizzes, and time management.',
      icon: Watch,
      color: '#059669',
      bgColor: '#ECFDF5',
      component: TimerStopwatch,
    },
    {
      id: 'converter',
      title: 'Unit Converter',
      description: 'Convert between length, area, mass, data, temperature, volume, time, and speed units instantly.',
      icon: Ruler,
      color: '#7C3AED',
      bgColor: '#F3E8FF',
      component: Converter,
    },
    {
      id: 'bouncing-words',
      title: 'Bouncing Words',
      description: 'Input a sentence and watch the words bounce around jumbled. Students click them in the correct order to rebuild the sentence.',
      icon: Shuffle,
      color: '#DB2777',
      bgColor: '#FCE7F3',
      component: BouncingWords,
    },
    {
      id: 'group-yourself',
      title: 'Group Yourself',
      description: 'Load learners from any class and randomly shuffle them into groups. Choose by group size or number of groups.',
      icon: Users,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      component: GroupYourself,
    },
    {
      id: 'random-groupings',
      title: 'Random Groupings Generator',
      description: 'A dedicated, highly configurable tool to quickly divide students into random groups or pairs with export capability.',
      icon: Grid,
      color: '#10B981',
      bgColor: '#ECFDF5',
      component: RandomGroupings,
    },
    {
      id: 'scoreboard',
      title: 'Scoreboard',
      description: 'Track team points and scores during classroom games and group quizzes.',
      icon: Trophy,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      component: Scoreboard,
    },
    {
      id: 'flashcards',
      title: 'Flashcards & Match',
      description: 'Study custom term decks with flipping cards or play a timed memory card matching game.',
      icon: Layers,
      color: '#6366F1',
      bgColor: '#EEF2FF',
      component: Flashcards,
    },
    {
      id: 'soundboard',
      title: 'Classroom Soundboard',
      description: 'Play transition cues, ticking clock suspense, applause, and correct/incorrect retro sound effects.',
      icon: Volume2,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      component: Soundboard,
    },
    {
      id: 'word-search',
      title: 'Word Search Generator',
      description: 'Generate customizable word search puzzle boards dynamically from your spelling list.',
      icon: HelpCircle,
      color: '#EC4899',
      bgColor: '#FDF2F8',
      component: WordSearch,
    },
    {
      id: 'raffle-jar',
      title: 'Raffle Ticket Jar',
      description: 'Draw random student names out of a beautifully animated ticket jar.',
      icon: Ticket,
      color: '#D97706',
      bgColor: '#FFFBEB',
      component: RaffleJar,
    },
    {
      id: 'tug-of-war',
      title: 'Tug of War',
      description: 'Split your class into two teams and battle it out! Click "Pull!" to randomly tug the rope. First team to pull it to their side wins.',
      icon: Scale,
      color: '#D97706',
      bgColor: '#FFFBEB',
      component: TugOfWar,
    },
    {
      id: 'coin-flip',
      title: 'Coin Flip',
      description: 'Flip a virtual coin to decide between Heads or Tails. Tracks your flip history with a running tally.',
      icon: CircleDollarSign,
      color: '#FCB932',
      bgColor: '#FFFBE6',
      component: CoinFlip,
    },
    {
      id: 'dice-roller',
      title: 'Dice Roller',
      description: 'Roll up to 5 virtual dice with a single click. Keeps a running history of your rolls and totals.',
      icon: Dices,
      color: '#DC2626',
      bgColor: '#FEF2F2',
      component: DiceRoller,
    },
  ];

  const handleBack = () => {
    setActiveTool(null);
  };

  const selectedTool = tools.find((t) => t.id === activeTool);

  if (selectedTool) {
    const ActiveComponent = selectedTool.component;
    return <ActiveComponent onBack={handleBack} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Games & Tools</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Interactive utilities for classroom engagement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="flex items-center gap-4 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-4 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition duration-200 select-none group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: tool.bgColor }}
                >
                  <Icon size={24} color={tool.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 leading-normal">
                    {tool.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
