
import { useState } from 'react';
import ReactPlayer from 'react-player';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { placementSuccessStories } from '../data/staticData';

const VideoTestimonialsSection = () => {
    const [selectedStory, setSelectedStory] = useState<typeof placementSuccessStories[0] | null>(null);

    return (
        <section className="w-full py-12 lg:py-16 relative">
            <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Success Stories</h2>
                <p className="text-gray-400 max-w-2xl mx-auto px-4">See how our learners transformed their careers with our certifications.</p>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto gap-6 max-w-7xl mx-auto px-4 pb-8 snap-x no-scrollbar">
                {placementSuccessStories.map((story) => (
                    <div
                        key={story.id}
                        className="min-w-[300px] sm:min-w-[350px] bg-[#0B1E32] rounded-xl overflow-hidden border border-white/10 hover:border-[#98D048]/50 transition-all duration-300 group cursor-pointer snap-center"
                        onClick={() => setSelectedStory(story)}
                    >
                        {/* Thumbnail Container */}
                        <div className="relative h-48 overflow-hidden bg-black/50">
                            {story.thumbNail ? (
                                <img
                                    src={story.thumbNail}
                                    alt={story.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#182C3F]">
                                    <span className="text-white/20 text-4xl font-bold">?</span>
                                </div>
                            )}

                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{story.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                        <span className="bg-white/5 px-2 py-0.5 rounded">{story.from}</span>
                                        <span className="text-[#98D048]">→</span>
                                        <span className="bg-[#98D048]/10 text-[#98D048] px-2 py-0.5 rounded font-medium">{story.to}</span>
                                    </div>
                                </div>
                                {story.companyLogo && (
                                    <img src={story.companyLogo} alt="Company" className="h-6 object-contain max-w-[80px]" />
                                )}
                            </div>

                            <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                                {story.description}
                            </p>

                            <div className="mt-4 text-[#98D048] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                Watch Story <span>→</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Video Modal */}
            <Dialog
                open={!!selectedStory}
                onClose={() => setSelectedStory(null)}
                className="relative z-[9999]"
            >
                <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" />

                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-4xl max-h-[85vh] bg-black rounded-xl overflow-hidden shadow-2xl relative flex flex-col">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedStory(null)}
                            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            ✕
                        </button>

                        <div className="aspect-video w-full bg-black flex items-center justify-center flex-shrink-0">
                            {selectedStory && (
                                <ReactPlayer
                                    src={selectedStory.videoUrl || ""}
                                    width="100%"
                                    height="100%"
                                    playing={true}
                                    controls={true}
                                />
                            )}
                        </div>

                        {selectedStory && (
                            <div className="p-6 bg-[#0B1E32] overflow-y-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold text-white">{selectedStory.name}</h3>
                                    {selectedStory.companyLogo && (
                                        <img src={selectedStory.companyLogo} alt="Company" className="h-6" />
                                    )}
                                </div>
                                <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                                    {selectedStory.description}
                                </p>
                            </div>
                        )}
                    </DialogPanel>
                </div>
            </Dialog>
        </section>
    );
};

export default VideoTestimonialsSection;
