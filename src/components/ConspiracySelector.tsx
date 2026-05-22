"use client";

import { useState } from "react";
import type { SkepticismLevel } from "@/lib/types";

const CONSPIRACIES = [
  {
    title: "Birds Aren't Real",
    description:
      "The government replaced every bird with a surveillance drone in 1959. They charge on power lines.",
  },
  {
    title: "The Sugar Conspiracy",
    description:
      "The sugar industry paid Harvard scientists to blame fat for heart disease and got away with it for 50 years",
  },
  {
    title: "Apple Slows Down Your Old iPhone",
    description:
      "Apple deliberately throttles older devices to push you into buying new ones",
  },
  {
    title: "Your Phone Is Always Listening",
    description:
      "You mention something once and get an ad for it an hour later — that can't be a coincidence",
  },
  {
    title: "We Live in a Simulation",
    description:
      "Reality is just someone else's video game and the glitches are everywhere",
  },
  {
    title: "Flat Earth",
    description:
      "The earth is a disc and NASA has been lying to all of us since day one",
  },
];

const SKEPTICISM_LEVELS: {
  level: SkepticismLevel;
  label: string;
  quote: string;
}[] = [
  {
    level: "easy",
    label: "r/conspiracy",
    quote:
      '"bro just look it up. they deleted the original post but i saved it"',
  },
  {
    level: "medium",
    label: "Reuters",
    quote:
      '"Sources familiar with the matter suggest further investigation is warranted."',
  },
  {
    level: "hard",
    label: "Snopes",
    quote: '"Rating: FALSE. This image was taken out of context in 2019."',
  },
];

const LEVELS: SkepticismLevel[] = ["easy", "medium", "hard"];

interface Props {
  onStart: (conspiracy: string, skepticism: SkepticismLevel) => void;
}

export default function ConspiracySelector({ onStart }: Props) {
  const [custom, setCustom] = useState("");
  const [skepticism, setSkepticism] = useState<SkepticismLevel>("medium");

  const current = SKEPTICISM_LEVELS.find((s) => s.level === skepticism)!;
  const sliderIdx = LEVELS.indexOf(skepticism);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* bg image — drop any jpg/png into /public/bg.jpg to use it */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url('/bg.png')",
          filter: "invert(1)",
          opacity: 0.3,
        }}
      />
      <div className="absolute inset-0 bg-black/75" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative z-10 w-full flex flex-col items-center">
        <h1 className="text-5xl font-black tracking-tight mb-3 text-white">
          FIRE REVIEWED
        </h1>
        <p className="text-gray-400 text-base mb-10 text-center max-w-md leading-relaxed">
          Four AI models crawl the web researching a conspiracy until one by one
          they crack.
          <br />
          <span className="text-gray-600">
            Watch which model loses its mind first.
          </span>
        </p>

        {/* skepticism slider */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">
              Journalist skepticism
            </div>
            <div className="text-sm font-bold text-orange-400">
              {current.label}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={sliderIdx}
            onChange={(e) => setSkepticism(LEVELS[Number(e.target.value)])}
            className="w-full accent-orange-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-gray-700 mt-1 px-0.5">
            {SKEPTICISM_LEVELS.map((s) => (
              <span
                key={s.level}
                className={s.level === skepticism ? "text-gray-400" : ""}
              >
                {s.label}
              </span>
            ))}
          </div>

          <p className="mt-3 text-sm text-gray-500 italic text-center min-h-[1.5rem] transition-all">
            {current.quote}
          </p>
        </div>

        <div className="w-full max-w-2xl mb-3">
          <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">
            Pick a conspiracy
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-8">
          {CONSPIRACIES.map((c) => (
            <button
              key={c.title}
              onClick={() => onStart(c.title, skepticism)}
              className="group bg-gray-900/80 border border-gray-800 rounded-xl p-4 text-left hover:border-orange-500 hover:bg-gray-800 transition-all cursor-pointer"
            >
              <div className="font-bold text-white group-hover:text-orange-400 mb-1">
                {c.title}
              </div>
              <div className="text-sm text-gray-500">{c.description}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full max-w-2xl">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="or type your own conspiracy..."
            className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            onKeyDown={(e) =>
              e.key === "Enter" &&
              custom.trim() &&
              onStart(custom.trim(), skepticism)
            }
          />
          <button
            onClick={() => custom.trim() && onStart(custom.trim(), skepticism)}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer"
          >
            RESEARCH
          </button>
        </div>
      </div>
    </div>
  );
}
