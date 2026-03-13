import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { FadeUp, ScaleIn, PressEffect, MagneticHover, RippleButton, useCardPhysics } from '../components/ui/animations';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { Activity, BarChart3, Users, Calendar, Zap, Heart, Star, Settings } from 'lucide-react';

/**
 * CardShowcase — Visual QA page for the Neo-Skeuomorphism design system.
 * Renders all Card variants, animation primitives, and interaction demos.
 */
export default function CardShowcasePage() {
  const [expandedDemo, setExpandedDemo] = useState(false);

  return (
    <div className="page-container">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1>Component Showcase</h1>
        <p>Neo-Skeuomorphism design system — Cards, animations, and interaction primitives</p>
      </div>

      {/* ═══════════════════════════════════
          SECTION: Card Variants
          ═══════════════════════════════════ */}
      <FadeUp className="space-y-10">
        {/* ── Card.Flat ── */}
        <section className="space-y-3">
          <h2 className="text-section-title">Card.Flat — Default Elevated</h2>
          <p className="text-caption">Hover to lift, click/press to depress. Multi-layer shadow with inner light rim and noise texture.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card.Flat padding="md" onClick={() => {}}>
              <Card.Header icon={<Calendar className="w-4 h-4" />} badge="Live">
                <h3 className="text-sm font-bold text-gray-900">OR Schedule</h3>
                <p className="text-xs text-gray-400">Today's operations</p>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-600">
                  Interactive flat card. Lifts -4px on hover, presses down +2px on click with shadow compression.
                </p>
              </Card.Body>
              <Card.Footer actions={[
                <Button key="view" variant="ghost" size="sm">View</Button>,
                <Button key="edit" variant="secondary" size="sm">Edit</Button>,
              ]} />
            </Card.Flat>

            <Card.Flat loading />

            <Card.Flat empty>
              <span>Empty state — dashed border with gentle pulse</span>
            </Card.Flat>
          </div>
        </section>

        {/* ── Card.Glass ── */}
        <section className="space-y-3">
          <h2 className="text-section-title">Card.Glass — Frosted Glass</h2>
          <p className="text-caption">backdrop-filter blur(20px) saturate(180%). Hover increases blur to 28px.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.24 270 / 0.15), oklch(0.78 0.18 85 / 0.10), oklch(0.62 0.20 145 / 0.10))',
            }}
          >
            <Card.Glass padding="md" onClick={() => {}}>
              <Card.Header icon={<Zap className="w-4 h-4" />}>
                <h3 className="text-sm font-bold text-gray-900">Live Status</h3>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-600">Translucent surface over colored backgrounds. The glass effect scales with hover interaction.</p>
              </Card.Body>
            </Card.Glass>

            <Card.Glass padding="md">
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Patient Recovery</p>
                    <p className="text-xs text-gray-500">PACU tracking active</p>
                  </div>
                </div>
              </Card.Body>
            </Card.Glass>

            <Card.Glass padding="md" loading />
          </div>
        </section>

        {/* ── Card.Tilt ── */}
        <section className="space-y-3">
          <h2 className="text-section-title">Card.Tilt — 3D Perspective</h2>
          <p className="text-caption">perspective: 800px. rotateX/Y follow cursor ±12deg. Specular light highlight moves opposite to tilt.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card.Tilt padding="md">
              <Card.Header icon={<Star className="w-4 h-4" />} badge="Premium">
                <h3 className="text-sm font-bold text-gray-900">3D Tilt Card</h3>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-600">Move your cursor over this card. Watch the specular highlight follow the light source (opposite to cursor).</p>
              </Card.Body>
            </Card.Tilt>

            <Card.Tilt padding="md" onClick={() => {}}>
              <Card.Body>
                <div className="text-center py-3">
                  <p className="text-2xl font-bold text-gray-900 mb-1">12</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active ORs</p>
                </div>
              </Card.Body>
            </Card.Tilt>

            <Card.Tilt padding="md">
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-accent-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">System Settings</p>
                    <p className="text-xs text-gray-500">Configuration panel</p>
                  </div>
                </div>
              </Card.Body>
            </Card.Tilt>
          </div>
        </section>

        {/* ── Card.Magnetic ── */}
        <section className="space-y-3">
          <h2 className="text-section-title">Card.Magnetic — Cursor Following</h2>
          <p className="text-caption">Card body follows cursor with spring physics. Max displacement: 8px X, 6px Y. Rubber-band snap-back.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card.Magnetic padding="md" onClick={() => {}}>
              <Card.Body>
                <div className="text-center py-2">
                  <p className="text-lg font-bold text-gray-900">Magnetic Card</p>
                  <p className="text-xs text-gray-400 mt-1">This entire card follows your cursor</p>
                </div>
              </Card.Body>
            </Card.Magnetic>

            <Card.Magnetic padding="md">
              <Card.Header icon={<Activity className="w-4 h-4" />}>
                <h3 className="text-sm font-bold text-gray-900">Live Monitoring</h3>
                <p className="text-xs text-gray-400">Real-time updates</p>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-600">Spring-based physics with rubber-band easing on mouse leave.</p>
              </Card.Body>
            </Card.Magnetic>

            <Card.Magnetic padding="md" loading />
          </div>
        </section>

        {/* ── Card.Expandable ── */}
        <section className="space-y-3">
          <h2 className="text-section-title">Card.Expandable — Click to Expand</h2>
          <p className="text-caption">Smooth height animation via Framer Motion layout. Content fades in with 80ms delay.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card.Expandable
              summary={
                <div>
                  <p className="text-sm font-bold text-gray-900">Surgery Details — Patient #4521</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click to expand for full procedure details</p>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Procedure</p>
                    <p className="text-sm text-gray-700 mt-0.5">Laparoscopic Cholecystectomy</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Surgeon</p>
                    <p className="text-sm text-gray-700 mt-0.5">Dr. Santos</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">OR Room</p>
                    <p className="text-sm text-gray-700 mt-0.5">OR-3</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Duration</p>
                    <p className="text-sm text-gray-700 mt-0.5">~2 hours</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm">Reschedule</Button>
                  <Button variant="accent" size="sm">Confirm</Button>
                </div>
              </div>
            </Card.Expandable>

            <Card.Expandable
              defaultExpanded
              summary={
                <div>
                  <p className="text-sm font-bold text-gray-900">Anesthesia Notes</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pre-operative assessment</p>
                </div>
              }
            >
              <p className="text-sm text-gray-600 leading-relaxed">
                Patient cleared for general anesthesia. ASA classification II. No known allergies. NPO status confirmed since midnight. Pre-op labs within normal limits.
              </p>
            </Card.Expandable>
          </div>
        </section>

        {/* ── Card.Stat ── */}
        <section className="space-y-3">
          <h2 className="text-section-title">Card.Stat — Metric / Data Cards</h2>
          <p className="text-caption">Animated counter on viewport entry (0 → value over 800ms). Sparkline draws itself. Trend pulse.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card.Stat
              label="Total Bookings"
              value={248}
              trend="up"
              trendLabel="+18%"
              icon={<Calendar className="w-4 h-4" />}
              sparkline={[12, 18, 14, 22, 28, 25, 32, 30, 35, 38, 42, 48]}
            />
            <Card.Stat
              label="Active ORs"
              value={8}
              suffix="/12"
              trend="neutral"
              trendLabel="Stable"
              icon={<Activity className="w-4 h-4" />}
            />
            <Card.Stat
              label="Avg Duration"
              value={94}
              suffix=" min"
              trend="down"
              trendLabel="-8%"
              icon={<BarChart3 className="w-4 h-4" />}
              sparkline={[110, 105, 98, 102, 95, 92, 96, 90, 94]}
            />
            <Card.Stat
              label="Staff On Duty"
              value={42}
              trend="up"
              trendLabel="+3"
              icon={<Users className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* ═══════════════════════════════════
            SECTION: Animation Primitives Demo
            ═══════════════════════════════════ */}
        <section className="space-y-3 mt-4">
          <h2 className="text-section-title">Animation Primitives</h2>
          <p className="text-caption">Core animation components: FadeUp stagger, ScaleIn spring, PressEffect, MagneticHover, RippleButton.</p>

          {/* ScaleIn demo */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ScaleIn (spring)</p>
            <div className="flex gap-3">
              <ScaleIn>
                <div className="card p-4 w-32 text-center">
                  <p className="text-sm font-bold text-gray-700">Scale In</p>
                  <p className="text-xs text-gray-400">Spring easing</p>
                </div>
              </ScaleIn>
            </div>
          </div>

          {/* PressEffect demo */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">PressEffect (click me)</p>
            <div className="flex gap-3">
              <PressEffect>
                <div className="card p-4 px-6 cursor-pointer select-none">
                  <p className="text-sm font-bold text-gray-700">Press me!</p>
                  <p className="text-xs text-gray-400">scale(0.96) on press</p>
                </div>
              </PressEffect>
              <PressEffect scale={0.92}>
                <div className="card-elevated p-4 px-6 cursor-pointer select-none">
                  <p className="text-sm font-bold text-gray-700">Deep press</p>
                  <p className="text-xs text-gray-400">scale(0.92)</p>
                </div>
              </PressEffect>
            </div>
          </div>

          {/* MagneticHover demo */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">MagneticHover (move cursor over)</p>
            <div className="flex gap-4">
              <MagneticHover maxTilt={10} maxTranslate={8}>
                <div className="card-elevated p-5 w-40 text-center cursor-pointer">
                  <p className="text-sm font-bold text-gray-700">Magnetic</p>
                  <p className="text-xs text-gray-400 mt-1">±10deg tilt</p>
                </div>
              </MagneticHover>
              <MagneticHover maxTilt={5} maxTranslate={4}>
                <div className="card p-5 w-40 text-center cursor-pointer">
                  <p className="text-sm font-bold text-gray-700">Subtle</p>
                  <p className="text-xs text-gray-400 mt-1">±5deg tilt</p>
                </div>
              </MagneticHover>
            </div>
          </div>

          {/* RippleButton demo */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">RippleButton (click anywhere on surface)</p>
            <div className="flex gap-3">
              <RippleButton
                className="card-elevated px-6 py-3 rounded-xl cursor-pointer select-none"
                onClick={() => {}}
              >
                <span className="text-sm font-bold text-gray-700">Ripple Effect</span>
              </RippleButton>
              <RippleButton
                className="bg-accent-600 text-white px-6 py-3 rounded-xl cursor-pointer select-none border border-accent-700 shadow-[0_2px_4px_oklch(0.3_0.15_270/0.25),inset_0_1px_0_oklch(1_0_0/0.12)]"
                rippleColor="oklch(1 0 0 / 0.20)"
                onClick={() => {}}
              >
                <span className="text-sm font-bold">Accent Ripple</span>
              </RippleButton>
            </div>
          </div>
        </section>

        {/* ── Composition API Demo ── */}
        <section className="space-y-3 mt-4">
          <h2 className="text-section-title">Composition API</h2>
          <p className="text-caption">Card.Header + Card.Body + Card.Footer compound components work with any variant.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card.Glass padding="none">
              <Card.Header icon={<Calendar className="w-4 h-4" />} badge="Urgent">
                <h3 className="text-sm font-bold text-gray-900">Emergency Booking</h3>
                <p className="text-xs text-gray-400">Priority case</p>
              </Card.Header>
              <Card.Body>
                <p className="text-sm text-gray-600">
                  Compound Card API: Header with icon + badge, Body with content, Footer with action buttons.
                </p>
              </Card.Body>
              <Card.Footer actions={[
                <Button key="cancel" variant="ghost" size="sm">Cancel</Button>,
                <Button key="confirm" variant="accent" size="sm">Confirm Booking</Button>,
              ]} />
            </Card.Glass>

            <Card.Tilt padding="none">
              <Card.Header extra={<span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">Online</span>}>
                <h3 className="text-sm font-bold text-gray-900">OR Room 5</h3>
                <p className="text-xs text-gray-400">General Surgery</p>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current</span>
                    <span className="font-semibold text-gray-800">Appendectomy</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Surgeon</span>
                    <span className="font-semibold text-gray-800">Dr. Cruz</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-accent-500 w-[65%]" />
                  </div>
                </div>
              </Card.Body>
              <Card.Footer>
                <span className="text-xs text-gray-400">Est. 45 min remaining</span>
              </Card.Footer>
            </Card.Tilt>
          </div>
        </section>

        {/* ═══════════════════════════════════
            SECTION: useCardPhysics() Hook Demo
            ═══════════════════════════════════ */}
        <section className="space-y-3 mt-4">
          <h2 className="text-section-title">useCardPhysics() — Unified Composable Hook</h2>
          <p className="text-caption">
            One hook, three behaviors: tilt (3D perspective), magnetic (cursor displacement), press (scale).
            Enable any combination. Spread <code className="text-gray-500 bg-gray-100 px-1 rounded">physics.bind()</code> onto a <code className="text-gray-500 bg-gray-100 px-1 rounded">{'<motion.div>'}</code>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PhysicsDemo
              title="All Three"
              desc="tilt + magnetic + press"
              config={{ tilt: true, magnetic: true, press: true }}
            />
            <PhysicsDemo
              title="Tilt Only"
              desc="3D perspective, ±12deg"
              config={{ tilt: { maxDeg: 12, specular: true } }}
            />
            <PhysicsDemo
              title="Magnetic + Press"
              desc="Follows cursor, press to squish"
              config={{ magnetic: { maxX: 10, maxY: 8 }, press: { scale: 0.94 } }}
            />
            <PhysicsDemo
              title="Custom Spring"
              desc="Stiff spring, low damping"
              config={{ tilt: true, magnetic: true, spring: { stiffness: 600, damping: 10, mass: 0.4 } }}
            />
          </div>
        </section>
      </FadeUp>
    </div>
  );
}

/* ── Helper component for useCardPhysics() demo ── */
function PhysicsDemo({
  title,
  desc,
  config,
}: {
  title: string;
  desc: string;
  config: Parameters<typeof useCardPhysics>[0];
}) {
  const physics = useCardPhysics(config);

  return (
    <div style={{ perspective: 800 }}>
      <motion.div
        {...physics.bind()}
        className="card-elevated p-5 cursor-pointer select-none relative overflow-hidden"
      >
        {/* Specular highlight (visible when tilt is enabled) */}
        {physics.state.isHovered && config?.tilt && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none z-10"
            style={{
              background: `radial-gradient(ellipse at ${physics.state.specularX}% ${physics.state.specularY}%, oklch(1 0 0 / 0.12) 0%, transparent 60%)`,
            }}
          />
        )}

        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{desc}</p>

        {/* Live state readout */}
        <div className="mt-3 pt-3 border-t border-gray-200/60 grid grid-cols-2 gap-x-3 gap-y-1 tabular-nums">
          <span className="text-[10px] text-gray-400">nX</span>
          <span className="text-[10px] font-mono text-gray-600">{physics.state.normalX.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400">nY</span>
          <span className="text-[10px] font-mono text-gray-600">{physics.state.normalY.toFixed(2)}</span>
          <span className="text-[10px] text-gray-400">pressed</span>
          <span className={`text-[10px] font-mono ${physics.state.isPressed ? 'text-accent-600 font-bold' : 'text-gray-400'}`}>
            {physics.state.isPressed ? 'true' : 'false'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
