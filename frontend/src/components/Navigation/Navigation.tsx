import { useLocation } from 'react-router-dom';
import PillNav from '../PillNav/PillNav';

const navLinks = [
  { href: '/timeline', label: 'Timeline' },
  { href: '/register', label: 'Register' },
  { href: '/parties', label: 'Parties' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/mythcheck', label: 'Fact-Check' },
  { href: '/institutions', label: 'Institutions' },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <div className="flex items-center gap-4">
      <PillNav
        items={navLinks}
        activeHref={location.pathname}
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="#F0EDE4"
        pillColor="rgba(70, 89, 64, 0.06)"
        hoveredPillTextColor="#FDFBF0"
        pillTextColor="#465940"
        initialLoadAnimation={false}
      />
    </div>
  );
}
