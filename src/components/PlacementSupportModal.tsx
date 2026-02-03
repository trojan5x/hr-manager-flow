import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { pointsTwo } from '../data/staticData';

interface PlacementSupportModalProps {
    isOpen: boolean;
    closeModal: () => void;
    selectedStory: {
        videoUrl: string;
        companyModalLogo: string;
        name: string;
        from: string;
        to: string;
    } | null;
}

const PlacementSupportModal: React.FC<PlacementSupportModalProps> = ({ isOpen, closeModal, selectedStory }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [played, setPlayed] = useState(0);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen) {
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    }, [isOpen]);

    const handleProgress = (state: { played: number }) => {
        setPlayed(state.played);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/85" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-[#1B1B1B] p-0 text-left align-middle shadow-xl transition-all border border-purple-500/20">
                                <button
                                    onClick={closeModal}
                                    className="absolute right-4 top-4 z-10 text-white/70 hover:text-white transition-colors"
                                >
                                    <FontAwesomeIcon icon={faXmark} className="text-2xl" />
                                </button>
                                <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[600px]">
                                    {/* Left Side - Video Player */}
                                    <div className="w-full lg:w-[40%] bg-black relative flex items-center justify-center group">
                                        {selectedStory && (
                                            <div className='relative w-full h-full'>
                                                <ReactPlayer
                                                    ref={playerRef}
                                                    url={selectedStory.videoUrl}
                                                    width="100%"
                                                    height="100%"
                                                    playing={isPlaying}
                                                    muted={isMuted}
                                                    loop={true}
                                                    onProgress={handleProgress as any}
                                                    controls={false}
                                                    style={{ objectFit: 'cover' }}
                                                    config={{
                                                        youtube: {
                                                            // @ts-ignore
                                                            playerVars: { showinfo: 0, controls: 0, rel: 0, modestbranding: 1 } as any
                                                        }
                                                    }}
                                                />

                                                {/* Custom Mute Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleMute();
                                                    }}
                                                    className="absolute bottom-6 right-6 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                                                >
                                                    <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} className="w-5 h-5" />
                                                </button>

                                                {/* Progress Bar */}
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                                                    <div
                                                        className="h-full bg-[#f0a500]"
                                                        style={{ width: `${played * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side - Content */}
                                    <div className="w-full lg:w-[60%] p-8 overflow-y-auto bg-gradient-to-br from-[#1B1B1B] to-[#121212]">
                                        {selectedStory && (
                                            <>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                                        <img
                                                            src={selectedStory.companyModalLogo}
                                                            alt="Company Logo"
                                                            className="h-10 w-auto object-contain"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-white mb-1">{selectedStory.name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">{selectedStory.from}</span>
                                                            <span className="text-[#f0a500]">➜</span>
                                                            <span className="px-2 py-0.5 rounded bg-[#f0a500]/10 border border-[#f0a500]/20 text-[#f0a500] text-xs font-semibold">{selectedStory.to}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                                            Placement Support
                                                        </h4>
                                                        <p className="text-gray-300 leading-relaxed font-light">
                                                            Our dedicated placement team works tirelessly to connect you with top opportunities.
                                                            Here's how we support your career journey:
                                                        </p>
                                                    </div>

                                                    <div className="grid gap-3">
                                                        {pointsTwo.map((point) => (
                                                            <div
                                                                key={point.id}
                                                                className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all duration-300"
                                                            >
                                                                <div className="flex items-start gap-4">
                                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                                        <span className="text-sm font-bold text-purple-400">{point.id}</span>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-white font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                                                                            {point.title}
                                                                        </h5>
                                                                        <p className="text-sm text-gray-400 leading-relaxed">
                                                                            {point.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={closeModal}
                                                        className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-[#f0a500] to-[#d48f00] text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(240,165,0,0.3)] transform hover:scale-[1.02] transition-all duration-300"
                                                    >
                                                        Start Your Success Story
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default PlacementSupportModal;
