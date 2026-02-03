
import Button from '../components/Button';
import TopBar from '../components/TopBar';
import HeroHeading from '../components/HeroHeading';
import TagList from '../components/TagList';
import CertificateFan from '../components/CertificateFan';
import InfoPills from '../components/InfoPills';
import StickyBottomBar from '../components/StickyBottomBar';

const DesignSystem = () => {
    return (
        <div className="min-h-screen text-white p-8 font-sans pb-32" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            <h1 className="text-4xl font-bold text-[#FFEA9A] mb-8">Design System</h1>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Colors</h2>
                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-[#00385C] border border-gray-700 rounded-lg shadow-md mb-2"></div>
                        <p className="text-sm text-gray-400">Gradient Start</p>
                        <p className="text-xs text-gray-500">#00385C</p>
                    </div>
                    <div className="text-center">
                        <div className="w-24 h-24 bg-[#001C2C] rounded-lg shadow-md mb-2"></div>
                        <p className="text-sm text-gray-400">Gradient End</p>
                        <p className="text-xs text-gray-500">#001C2C</p>
                    </div>
                    <div className="text-center">
                        <div className="w-24 h-24 bg-[#FFEA9A] rounded-lg shadow-md mb-2"></div>
                        <p className="text-sm text-gray-400">Brand Gold</p>
                        <p className="text-xs text-gray-500">#FFEA9A</p>
                    </div>
                    <div className="text-center">
                        <div className="w-24 h-24 bg-[#98D048] rounded-lg shadow-md mb-2"></div>
                        <p className="text-sm text-gray-400">Brand Lime</p>
                        <p className="text-xs text-gray-500">#98D048</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Typography</h2>
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold">Heading 1 (5xl)</h1>
                    <h2 className="text-4xl font-bold">Heading 2 (4xl)</h2>
                    <h3 className="text-3xl font-semibold">Heading 3 (3xl)</h3>
                    <p className="text-base text-gray-300">Body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Components</h2>

                <div className="mb-8">
                    <h3 className="text-xl font-medium mb-4 text-gray-300">Buttons</h3>
                    <div className="flex gap-4 items-center">
                        <Button variant="primary">Primary Button</Button>
                        <Button variant="secondary">Secondary Button</Button>
                        <Button variant="outline">Outline Button</Button>
                        <Button variant="primary" disabled>Disabled</Button>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-medium mb-4 text-gray-300">TopBar</h3>
                    <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <TopBar className="bg-[#052030]">
                            <div className="text-[#4285F4] font-bold text-xl">LearnTube.ai</div>
                            <div className="text-gray-400 text-sm">Google for Startups</div>
                        </TopBar>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-medium mb-4 text-gray-300">Hero Heading</h3>
                    <HeroHeading />
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-medium mb-4 text-gray-300">Tag List</h3>
                    <TagList />
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-medium mb-4 text-gray-300">Info Pills</h3>
                    <InfoPills />
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-medium mb-4 text-gray-300">Certificate Fan</h3>
                    <CertificateFan />
                </div>
            </section>

            <StickyBottomBar>
                <div className="flex items-center justify-between">
                    <div className="text-white">
                        <div className="font-bold">Ready to start?</div>
                        <div className="text-sm text-gray-400">Take the assessment now.</div>
                    </div>
                    <Button variant="primary">Begin Assessment Now</Button>
                </div>
            </StickyBottomBar>
        </div>
    );
};

export default DesignSystem;
