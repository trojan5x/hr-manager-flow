const TrustReinforcementSection = () => {
    return (
        <section className="py-20 px-4 md:px-6 bg-[#001018] border-y border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        Built for Senior Professionals, Not Freshers
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {/* Stat 1 */}
                    <div className="bg-[#001C2C] p-8 rounded-lg text-center hover:shadow-[0_0_20px_rgba(152,208,72,0.1)] transition-shadow duration-300">
                        <div className="text-4xl font-bold text-[#98D048] mb-2">34%</div>
                        <p className="text-white/80">Only 34% pass on first attempt</p>
                    </div>

                    {/* Stat 2 */}
                    <div className="bg-[#001C2C] p-8 rounded-lg text-center hover:shadow-[0_0_20px_rgba(152,208,72,0.1)] transition-shadow duration-300">
                        <div className="text-4xl font-bold text-[#98D048] mb-2">12.3</div>
                        <p className="text-white/80">Average years experience of participants</p>
                    </div>

                    {/* Stat 3 */}
                    <div className="bg-[#001C2C] p-8 rounded-lg text-center hover:shadow-[0_0_20px_rgba(152,208,72,0.1)] transition-shadow duration-300">
                        <div className="text-4xl font-bold text-[#98D048] mb-2">92%</div>
                        <p className="text-white/80">Report securing interviews within 30 days</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
                    <div className="border border-white/20 px-6 py-2 rounded text-white font-bold">IIBA Recognized</div>
                    <div className="border border-white/20 px-6 py-2 rounded text-white font-bold">DAMA Aligned</div>
                    <div className="border border-white/20 px-6 py-2 rounded text-white font-bold">CRISP-DM</div>
                </div>
            </div>
        </section>
    );
};

export default TrustReinforcementSection;
