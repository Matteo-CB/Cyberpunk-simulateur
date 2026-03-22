'use client';

import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';

function Bullet() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#00f0ff',
        marginRight: 12,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

function Separator() {
  return (
    <div
      style={{
        height: 1,
        background: 'linear-gradient(to right, #00f0ff20, #1e2030, transparent)',
        margin: '32px 0',
      }}
    />
  );
}

export default function LegalPage() {
  const sectionTitle: React.CSSProperties = {
    fontSize: 20,
    letterSpacing: '0.08em',
    color: '#e0e8f0',
    marginBottom: 14,
  };

  const bodyText: React.CSSProperties = {
    fontSize: 13,
    color: '#7a8a9a',
    lineHeight: 1.9,
  };

  const bulletItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: 10,
    fontSize: 13,
    color: '#7a8a9a',
    lineHeight: 1.8,
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ padding: '32px 24px', maxWidth: 760, width: '100%', margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <Link href="/">
            <span
              className="font-blender"
              style={{ fontSize: 11, cursor: 'pointer', color: '#3a3a4a', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3a4a'; }}
            >
              Back
            </span>
          </Link>
          <h1
            className="font-refinery"
            style={{
              fontSize: 32,
              letterSpacing: '0.1em',
              color: '#00f0ff',
              textShadow: '0 0 20px rgba(0,240,255,0.15)',
            }}
          >
            LEGAL
          </h1>
        </div>

        <div className="font-blender">
          {/* Disclaimer */}
          <section>
            <h2 className="font-refinery" style={sectionTitle}>Disclaimer</h2>
            <p style={bodyText}>
              Cyberpunk TCG Simulator is a <strong style={{ color: '#e0e8f0' }}>fan-made, non-commercial project</strong> created for educational and entertainment purposes only. This simulator is <strong style={{ color: '#e0e8f0' }}>not affiliated with, endorsed by, or connected to</strong> CD Projekt Red, R. Talsorian Games, Weird CO, or any other official Cyberpunk franchise holders.
            </p>
            <p style={{ ...bodyText, marginTop: 10 }}>
              This project does not generate any revenue and is provided free of charge to the community. No commercial use is intended.
            </p>
          </section>

          <Separator />

          {/* Intellectual Property */}
          <section>
            <h2 className="font-refinery" style={sectionTitle}>Intellectual Property</h2>
            <p style={bodyText}>
              The <strong style={{ color: '#e0e8f0' }}>Cyberpunk Trading Card Game</strong> is a product of <strong style={{ color: '#e0e8f0' }}>Weird CO</strong>, developed in collaboration with <strong style={{ color: '#e0e8f0' }}>CD Projekt Red</strong> and <strong style={{ color: '#e0e8f0' }}>R. Talsorian Games</strong>.
            </p>
            <p style={{ ...bodyText, marginTop: 10 }}>
              Cyberpunk, Cyberpunk 2077, Night City, and all related logos, character names, game mechanics, card artwork, and designs are trademarks and/or copyrighted material of their respective owners, including but not limited to:
            </p>
            <div style={{ paddingLeft: 8, marginTop: 14 }}>
              <div style={bulletItem}>
                <Bullet />
                <span><strong style={{ color: '#e0e8f0' }}>Weird CO</strong> Creator and publisher of the Cyberpunk TCG</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span><strong style={{ color: '#e0e8f0' }}>CD Projekt Red</strong> Developer of Cyberpunk 2077</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span><strong style={{ color: '#e0e8f0' }}>R. Talsorian Games</strong> Creator of the Cyberpunk tabletop RPG</span>
              </div>
            </div>
            <p style={{ ...bodyText, marginTop: 10 }}>
              All card artwork displayed in this simulator belongs to the original artists and their respective rights holders. Card images are used solely for the purpose of faithfully simulating the game experience.
            </p>
          </section>

          <Separator />

          {/* Fair Use */}
          <section>
            <h2 className="font-refinery" style={sectionTitle}>Fair Use</h2>
            <p style={bodyText}>
              This simulator reproduces game mechanics and card data for the purpose of allowing fans to practice and play the Cyberpunk TCG digitally. We believe this constitutes fair use as a non-commercial, transformative fan project. If any rights holder objects to this use, we will promptly comply with takedown requests.
            </p>
          </section>

          <Separator />

          {/* Privacy Policy */}
          <section>
            <h2 className="font-refinery" style={sectionTitle}>Privacy Policy</h2>
            <p style={bodyText}>
              We collect only the data strictly necessary to provide the service:
            </p>
            <div style={{ paddingLeft: 8, marginTop: 14 }}>
              <div style={bulletItem}>
                <Bullet />
                <span><strong style={{ color: '#e0e8f0' }}>Account data:</strong> Username, email address, hashed password</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span><strong style={{ color: '#e0e8f0' }}>Game data:</strong> Game history, ELO ratings, deck compositions, tournament results</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span><strong style={{ color: '#e0e8f0' }}>Discord data:</strong> Discord user ID and username (only if you choose to link your account)</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span><strong style={{ color: '#e0e8f0' }}>Analytics:</strong> Anonymous usage data via Google Analytics</span>
              </div>
            </div>
            <p style={{ ...bodyText, marginTop: 10 }}>
              We do <strong style={{ color: '#e0e8f0' }}>not</strong> sell, share, or distribute your personal data to any third party. Passwords are hashed with bcrypt and never stored in plain text. You can request deletion of your account and all associated data at any time.
            </p>
          </section>

          <Separator />

          {/* Terms of Use */}
          <section>
            <h2 className="font-refinery" style={sectionTitle}>Terms of Use</h2>
            <p style={bodyText}>
              By using this simulator, you agree to:
            </p>
            <div style={{ paddingLeft: 8, marginTop: 14 }}>
              <div style={bulletItem}>
                <Bullet />
                <span>Use the service respectfully and not harass other players</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span>Not attempt to exploit, hack, or disrupt the service</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span>Not create multiple accounts to manipulate rankings</span>
              </div>
              <div style={bulletItem}>
                <Bullet />
                <span>Accept that the service is provided as-is with no warranty</span>
              </div>
            </div>
            <p style={{ ...bodyText, marginTop: 10 }}>
              We reserve the right to ban accounts that violate these terms, either temporarily or permanently.
            </p>
          </section>

          <Separator />

          {/* Developer */}
          <section>
            <h2 className="font-refinery" style={sectionTitle}>Developer</h2>
            <p style={bodyText}>
              This simulator is developed and maintained by{' '}
              <a
                href="https://hiddenlab.fr"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00f0ff', textDecoration: 'none', transition: 'opacity 0.2s' }}
              >
                HiddenLab
              </a>.
            </p>
          </section>

          <Separator />

          {/* Contact */}
          <section>
            <h2 className="font-refinery" style={sectionTitle}>Contact and Takedown</h2>
            <p style={bodyText}>
              For any questions, concerns, or takedown requests from rights holders, please contact us via our{' '}
              <a
                href="https://discord.gg/SvAr4mudPV"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#5865F2', textDecoration: 'none' }}
              >
                Discord server
              </a>{' '}
              or through{' '}
              <a
                href="https://hiddenlab.fr"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00f0ff', textDecoration: 'none' }}
              >
                hiddenlab.fr
              </a>.
            </p>
          </section>

          {/* Footer */}
          <div
            style={{
              textAlign: 'center',
              paddingTop: 40,
              paddingBottom: 24,
              color: '#2a2a3a',
              fontSize: 10,
              lineHeight: 2,
            }}
          >
            <p>
              Cyberpunk TCG Simulator | Fan-made project by{' '}
              <a
                href="https://hiddenlab.fr"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00f0ff60', textDecoration: 'none' }}
              >
                HiddenLab
              </a>
            </p>
            <p>
              Cyberpunk TCG by Weird CO. Cyberpunk 2077 by CD Projekt Red. Cyberpunk RPG by R. Talsorian Games.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
