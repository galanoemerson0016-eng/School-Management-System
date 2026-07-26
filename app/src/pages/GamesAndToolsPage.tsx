import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Volume2, Paintbrush, Watch, Ruler, Shuffle, Users, Scale, 
  CircleDollarSign, Dices, Trophy, Layers, HelpCircle, Ticket, Grid, Search, 
  Gamepad2, Users2, Wrench, LayoutGrid, ArrowRight, Bomb, Grid3X3, ChevronDown, ChevronRight
} from 'lucide-react';

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
import { BombPass } from '../components/games-tools/BombPass';
import { QuizShow } from '../components/games-tools/QuizShow';
import { BalloonWordGame } from '../components/games-tools/BalloonWordGame';
import { CrosswordGenerator } from '../components/games-tools/CrosswordGenerator';

export type ToolCategory = 'games' | 'groupings' | 'utilities';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number; color?: string }>;
  color: string;
  bgColor: string;
  category: ToolCategory;
  categoryLabel: string;
  component: React.ComponentType<{ onBack: () => void }>;
}

export function GamesAndToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const tools: ToolItem[] = useMemo(() => [
    {
      id: 'bomb-pass',
      title: 'Bomb Pass / Hot Potato',
      description: 'Ticking bomb timer with explosion effects. Pass the potato fast before it explodes!',
      icon: Bomb,
      color: '#DC2626',
      bgColor: '#FEE2E2',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: BombPass,
    },
    {
      id: 'quiz-show',
      title: 'Quiz Show / Jeopardy',
      description: 'Interactive category quiz board with point values ($100-$500) and team score trackers.',
      icon: Trophy,
      color: '#D97706',
      bgColor: '#FEF3C7',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: QuizShow,
    },
    {
      id: 'balloon-word-game',
      title: 'Save the Balloon',
      description: 'Kid-friendly letter guessing game. Guess vocabulary terms before floating balloons pop!',
      icon: Sparkles,
      color: '#EC4899',
      bgColor: '#FDF2F8',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: BalloonWordGame,
    },
    {
      id: 'crossword-generator',
      title: 'Crossword Puzzle Generator',
      description: 'Create, solve, and print custom interactive crossword puzzle boards for your class.',
      icon: Grid3X3,
      color: '#059669',
      bgColor: '#D1FAE5',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: CrosswordGenerator,
    },
    {
      id: 'whiteboard',
      title: 'Whiteboard',
      description: 'Draw ideas, diagrams, and notes. Export as PNG when done.',
      icon: Paintbrush,
      color: '#111827',
      bgColor: '#F3F4F6',
      category: 'utilities',
      categoryLabel: 'Classroom Utilities',
      component: Whiteboard,
    },
    {
      id: 'wheel-of-names',
      title: 'Wheel of Names',
      description: 'Spin a colorful wheel to randomly select a name from your list. Great for recitation, group assignments, or classroom picks.',
      icon: Sparkles,
      color: '#D97706',
      bgColor: '#FEF3C7',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: WheelOfNames,
    },
    {
      id: 'noise-detection',
      title: 'Noise Detection',
      description: 'Monitor classroom sound levels using the built-in microphone. Provides real-time visual feedback to encourage students to stay quiet.',
      icon: Volume2,
      color: '#0284C7',
      bgColor: '#E0F2FE',
      category: 'utilities',
      categoryLabel: 'Classroom Utilities',
      component: NoiseDetection,
    },
    {
      id: 'timer-stopwatch',
      title: 'Timer & Stopwatch',
      description: 'Track time with a stopwatch or set a countdown timer. Great for classroom activities, quizzes, and time management.',
      icon: Watch,
      color: '#059669',
      bgColor: '#D1FAE5',
      category: 'utilities',
      categoryLabel: 'Classroom Utilities',
      component: TimerStopwatch,
    },
    {
      id: 'converter',
      title: 'Unit Converter',
      description: 'Convert between length, area, mass, data, temperature, volume, time, and speed units instantly.',
      icon: Ruler,
      color: '#7C3AED',
      bgColor: '#F3E8FF',
      category: 'utilities',
      categoryLabel: 'Classroom Utilities',
      component: Converter,
    },
    {
      id: 'bouncing-words',
      title: 'Bouncing Words',
      description: 'Input a sentence and watch the words bounce around jumbled. Students click them in the correct order to rebuild the sentence.',
      icon: Shuffle,
      color: '#DB2777',
      bgColor: '#FCE7F3',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: BouncingWords,
    },
    {
      id: 'group-yourself',
      title: 'Group Yourself',
      description: 'Load learners from any class and randomly shuffle them into groups. Choose by group size or number of groups.',
      icon: Users,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      category: 'groupings',
      categoryLabel: 'Groupings & Teams',
      component: GroupYourself,
    },
    {
      id: 'random-groupings',
      title: 'Random Groupings Generator',
      description: 'A dedicated, highly configurable tool to quickly divide students into random groups or pairs with export capability.',
      icon: Grid,
      color: '#10B981',
      bgColor: '#ECFDF5',
      category: 'groupings',
      categoryLabel: 'Groupings & Teams',
      component: RandomGroupings,
    },
    {
      id: 'scoreboard',
      title: 'Scoreboard',
      description: 'Track team points and scores during classroom games and group quizzes.',
      icon: Trophy,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      category: 'groupings',
      categoryLabel: 'Groupings & Teams',
      component: Scoreboard,
    },
    {
      id: 'flashcards',
      title: 'Flashcards & Match',
      description: 'Study custom term decks with flipping cards or play a timed memory card matching game.',
      icon: Layers,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      category: 'utilities',
      categoryLabel: 'Classroom Utilities',
      component: Flashcards,
    },
    {
      id: 'soundboard',
      title: 'Classroom Soundboard',
      description: 'Play transition cues, ticking clock suspense, applause, and correct/incorrect retro sound effects.',
      icon: Volume2,
      color: '#2563EB',
      bgColor: '#EFF6FF',
      category: 'utilities',
      categoryLabel: 'Classroom Utilities',
      component: Soundboard,
    },
    {
      id: 'word-search',
      title: 'Word Search Generator',
      description: 'Generate customizable word search puzzle boards dynamically from your spelling list.',
      icon: HelpCircle,
      color: '#EC4899',
      bgColor: '#FDF2F8',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: WordSearch,
    },
    {
      id: 'raffle-jar',
      title: 'Raffle Ticket Jar',
      description: 'Draw random student names out of a beautifully animated ticket jar.',
      icon: Ticket,
      color: '#D97706',
      bgColor: '#FEF3C7',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: RaffleJar,
    },
    {
      id: 'tug-of-war',
      title: 'Tug of War',
      description: 'Split your class into two teams and battle it out! Click "Pull!" to randomly tug the rope.',
      icon: Scale,
      color: '#EA580C',
      bgColor: '#FFEDD5',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: TugOfWar,
    },
    {
      id: 'coin-flip',
      title: 'Coin Flip',
      description: 'Flip a virtual coin to decide between Heads or Tails. Tracks your flip history with a running tally.',
      icon: CircleDollarSign,
      color: '#D97706',
      bgColor: '#FEF3C7',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: CoinFlip,
    },
    {
      id: 'dice-roller',
      title: 'Dice Roller',
      description: 'Roll up to 5 virtual dice with a single click. Keeps a running history of your rolls and totals.',
      icon: Dices,
      color: '#DC2626',
      bgColor: '#FEE2E2',
      category: 'games',
      categoryLabel: 'Games & Recitation',
      component: DiceRoller,
    },
  ], []);

  const categories = useMemo(() => [
    { id: 'all', label: 'All Items', icon: LayoutGrid, count: tools.length },
    { id: 'games', label: 'Interactive Games & Recitation', icon: Gamepad2, count: tools.filter(t => t.category === 'games').length },
    { id: 'groupings', label: 'Groupings & Team Work', icon: Users2, count: tools.filter(t => t.category === 'groupings').length },
    { id: 'utilities', label: 'Classroom Utilities', icon: Wrench, count: tools.filter(t => t.category === 'utilities').length },
  ], [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [tools, selectedCategory, searchQuery]);

  const groupedSections = useMemo(() => {
    if (selectedCategory !== 'all') {
      const catObj = categories.find(c => c.id === selectedCategory);
      return [
        {
          id: selectedCategory,
          title: catObj?.label || 'Category',
          icon: catObj?.icon || LayoutGrid,
          tools: filteredTools
        }
      ];
    }

    return [
      {
        id: 'games',
        title: 'Interactive Games & Recitation',
        icon: Gamepad2,
        badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30',
        tools: filteredTools.filter(t => t.category === 'games')
      },
      {
        id: 'groupings',
        title: 'Groupings & Team Work',
        icon: Users2,
        badgeBg: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30',
        tools: filteredTools.filter(t => t.category === 'groupings')
      },
      {
        id: 'utilities',
        title: 'Classroom Utilities & Helpers',
        icon: Wrench,
        badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30',
        tools: filteredTools.filter(t => t.category === 'utilities')
      }
    ].filter(section => section.tools.length > 0);
  }, [selectedCategory, filteredTools, categories]);

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleCollapseAll = () => {
    const allCollapsed = groupedSections.every((s) => collapsedSections[s.id]);
    const newState: Record<string, boolean> = {};
    groupedSections.forEach((s) => {
      newState[s.id] = !allCollapsed;
    });
    setCollapsedSections(newState);
  };

  const handleBack = () => {
    setActiveTool(null);
  };

  const selectedTool = tools.find((t) => t.id === activeTool);

  if (selectedTool) {
    const ActiveComponent = selectedTool.component;
    return <ActiveComponent onBack={handleBack} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 lg:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              Games & Tools
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest">
                {tools.length} Modules
              </span>
            </h2>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Classroom interactive games, team division tools, and real-time utilities
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-72 shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games or tools..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Collapse All Toggle Button */}
            {selectedCategory === 'all' && (
              <button
                onClick={toggleCollapseAll}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs shrink-0 cursor-pointer transition-all border border-slate-200 dark:border-white/10"
                title="Expand or Collapse All Category Sections"
              >
                {groupedSections.every((s) => collapsedSections[s.id]) ? 'Expand All' : 'Collapse All'}
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  isActive
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categorized Collapsible Sections */}
      {groupedSections.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-12 text-center text-slate-400">
          <p className="text-base font-bold">No games or tools found for "{searchQuery}".</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="mt-3 px-4 py-2 bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        groupedSections.map((section) => {
          const SectionIcon = section.icon || LayoutGrid;
          const isCollapsed = !!collapsedSections[section.id];

          return (
            <div key={section.id} className="space-y-4">
              {/* Collapsible Section Header Button */}
              <button
                onClick={() => toggleCollapse(section.id)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/5 shadow-xs hover:border-amber-500 transition-all cursor-pointer select-none group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <SectionIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight group-hover:text-amber-500 transition-colors">
                    {section.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-black border border-slate-200/50 dark:border-white/5">
                    {section.tools.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 group-hover:text-amber-500 transition-colors">
                  <span className="text-xs font-bold hidden sm:inline">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </span>
                  {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Tools Grid (Collapsible) */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {section.tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        className="flex items-start gap-4 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 cursor-pointer hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 select-none group relative overflow-hidden"
                      >
                        {/* Left Icon Accent */}
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: tool.bgColor }}
                        >
                          <Icon size={24} color={tool.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                              {tool.categoryLabel}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white group-hover:text-amber-500 transition-colors flex items-center gap-1">
                            {tool.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>

                        {/* Launch Hover Arrow */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-500">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
