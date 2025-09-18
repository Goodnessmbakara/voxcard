import Layout from '@/components/layout/Footer';
import { VoxCardLogo } from '@/components/shared/VoxCardLogo';

const About = () => {
  return (
    <>
      <div className="container py-12 max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-10">
          <VoxCardLogo size="lg" />
          <h1 className="text-4xl font-heading font-bold text-vox-secondary mt-4 mb-2">About VoxCard</h1>
          <p className="text-lg text-vox-secondary/80 font-sans text-center max-w-xl">
            VoxCard is a decentralized platform for community savings and rotating credit, inspired by traditional Ajo/Esusu models and powered by XION blockchain technology.
          </p>
        </div>
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-heading font-semibold text-vox-primary mb-2">Our Mission</h2>
            <p className="text-vox-secondary/80 font-sans">
              To empower communities to save safely and win together, eliminating middlemen and escrow risk through transparent, trustless smart contracts.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-heading font-semibold text-vox-primary mb-2">How It Works</h2>
            <ul className="list-disc pl-6 text-vox-secondary/80 font-sans space-y-2">
              <li>Anyone can create or join a savings group (circle).</li>
              <li>Funds are pooled and managed by XION smart contracts.</li>
              <li>Members take turns receiving the pooled funds, based on trust and schedule.</li>
              <li>All transactions are transparent and verifiable on-chain.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-heading font-semibold text-vox-primary mb-2">Why VoxCard?</h2>
            <ul className="list-disc pl-6 text-vox-secondary/80 font-sans space-y-2">
              <li>Decentralized, no single point of failure or control.</li>
              <li>Trust scoring for fair and secure participation.</li>
              <li>Flexible payment options and group customization.</li>
              <li>Community-driven, transparent, and inclusive.</li>
            </ul>
          </section>
        </div>
        <div className="mt-12 text-center">
          <span className="inline-block gradient-text font-heading text-2xl font-bold">Save Safe, Win Sure.</span>
        </div>
      </div>
    </>
  );
};

export default About; 