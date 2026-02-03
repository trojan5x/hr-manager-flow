import { faArrowRight, faChevronDown, faChevronUp, faPlay, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
// @ts-ignore
import 'swiper/css'
import { placementSuccessStories } from '../data/staticData'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import ReactPlayer from 'react-player'

const PlacementSuccessStory = () => {

    const [showWatchText, setShowWatchText] = useState(false)
    const [modalEnabled, setModalEnabled] = useState({ is_show: false, achievement: { name: '', description: '', from: '', to: '', thumbNail: '', videoUrl: '', companyModalLogo: '' } })
    const [isScrolledDown, setIsScrolledDown] = useState(false)
    const [isMuted, setIsMuted] = useState(true) // Add this state for mute control

    // Create refs for the first slide and video to detect when they come into view
    const firstSlideRef = useRef(null)
    const swiperRef = useRef<any>(null)
    const modalContainerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<any>(null)

    const isInView = useInView(firstSlideRef, {
        once: true,
        margin: "-100px 0px -100px 0px"
    })

    useEffect(() => {
        if (isInView) {
            console.log('🎯 PlacementSuccessStory component came into view! Starting timers...')

            // Show the "Watch" text after 1.5 seconds when component comes into view
            const watchTimer = setTimeout(() => {
                setShowWatchText(true)
                console.log('✅ Watch text shown after 1.5 seconds')
            }, 1500)

            // Enable autoplay after 30 seconds when component comes into view
            const autoplayTimer = setTimeout(() => {
                // Manually start autoplay on the Swiper instance
                if (swiperRef.current && swiperRef.current.swiper) {
                    swiperRef.current.swiper.autoplay.start()
                    console.log('🚀 Autoplay started after 30 seconds! Slider will now move every 6 seconds')
                } else {
                    console.log('❌ Swiper ref not available for autoplay')
                }
            }, 30000)

            return () => {
                clearTimeout(watchTimer)
                clearTimeout(autoplayTimer)
            }
        }
    }, [isInView])

    // Reset mute when modal closes
    useEffect(() => {
        if (!modalEnabled.is_show) {
            setIsMuted(true);
        }
    }, [modalEnabled.is_show]);

    // Add scroll handler for modal content
    const handleModalScroll = (e: any) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setIsScrolledDown(isAtBottom);
    };

    // Add scroll functions for arrow container
    const scrollToTop = () => {
        if (modalContainerRef.current) {
            modalContainerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    const scrollToBottom = () => {
        if (modalContainerRef.current) {
            modalContainerRef.current.scrollTo({
                top: modalContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const handleArrowContainerClick = () => {
        if (isScrolledDown) {
            scrollToTop();
        } else {
            scrollToBottom();
        }
    };

    // Add mute toggle function
    const toggleMute = () => {
        setIsMuted(prev => !prev)
    }



    return (
        <div className='w-full'>
            <Swiper
                ref={swiperRef}
                spaceBetween={16}
                slidesPerView={1.8}
                loop={true}
                autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false
                }}
                speed={2000}
                navigation={false}
                modules={[Autoplay]}
                className="mySwiper"
                breakpoints={{
                    480: {
                        slidesPerView: 3.5,
                        spaceBetween: 12,
                    }
                }}
                onSwiper={(swiper) => {
                    // Initially stop autoplay
                    swiper.autoplay.stop()
                    console.log(' Swiper initialized, autoplay stopped')
                }}
            >
                {placementSuccessStories?.length > 0 && placementSuccessStories?.map((item, index) => (
                    <SwiperSlide key={index}>
                        <div className='w-full p-[2px] rounded-xl' style={{ backgroundImage: 'linear-gradient(143deg, #406AFF 0% , #2BBD13 100%' }} onClick={() => {
                            setModalEnabled(() => ({ is_show: true, achievement: item }))
                        }}>
                            <div className="rounded-xl flex relative w-full h-full flex-col items-center justify-center font-light cursor-pointer" style={{ backgroundImage: 'linear-gradient(to bottom, #25387C 0% , #070A16 100%' }}>
                                <div className='relative overflow-hidden h-[220px] md:h-[280px] rounded-t-xl w-full'>
                                    {/* Simplify: Always show image thumbnail for consistency and performance */}
                                    <img
                                        src={item?.thumbNail}
                                        className="w-full h-[220px] md:h-[280px] object-cover"
                                        loading='lazy'
                                        alt={item?.name}
                                    />

                                    {/* Overlays remain same */}
                                    <div className='absolute z-50 px-3 bottom-2 flex justify-evenly items-center text-white text-[12px] md:text-[14px] font-semibold items-start w-full gap-2'>
                                        {/* <h3 className='absolute bottom-1 z-50 left-3 font-medium text-white text-[14px] md:text-[16px]'>{item?.name}</h3> */}
                                        <div className='absolute z-50 px-3 bottom-2 flex justify-evenly items-center text-white text-[12px] md:text-[14px] font-semibold items-start w-full gap-2'>
                                            <div className='flex-1 leading-4 line-clamp-2'>
                                                <p>{item.from}</p>
                                            </div>
                                            <FontAwesomeIcon icon={faArrowRight} size="lg" className='text-white' />
                                            <div className='flex-1 text-end line-clamp-2'>
                                                <p>{item.to}</p>
                                            </div>
                                        </div>
                                        {index != 0 && <img src="https://assets.learntube.ai/files/Academy%20bundle/streamline_volume-mute.svg" width={24} height={24} className='absolute top-1 right-1 ' />}
                                        {index == 0 && (
                                            <div ref={firstSlideRef}>
                                                <motion.div
                                                    className="absolute top-1 left-1 bg-black/20 backdrop-blur-[4px] text-[12px] font-medium text-white flex gap-1 justify-center items-center overflow-hidden rounded-full h-8"
                                                    initial={{ width: 32 }}
                                                    animate={{
                                                        width: showWatchText ? 80 : 32
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        ease: "easeOut"
                                                    }}
                                                >
                                                    <motion.div
                                                        initial={{ opacity: 1, scale: 1 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0 }}
                                                    >
                                                        <FontAwesomeIcon icon={faPlay} className='text-white z-50' size="xs" />
                                                    </motion.div>

                                                    <AnimatePresence>
                                                        {showWatchText && (
                                                            <motion.span
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -10 }}
                                                                transition={{
                                                                    duration: 0.4,
                                                                    ease: "easeOut"
                                                                }}
                                                                className="whitespace-nowrap"
                                                            >
                                                                Watch
                                                            </motion.span>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>

                                    <div className='p-3 w-full flex justify-between items-center'>
                                        <div className='font-bold text-[14px] md:text-[16px] text-left text-white/50 line-clamp-1'>
                                            {item?.name}
                                        </div>
                                        <img src={item?.companyLogo} width={'auto'} height={24} className='h-6 md:h-8' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Re-structured Dialog for Headless UI v2 */}
            <Dialog
                open={modalEnabled?.is_show}
                onClose={() => setModalEnabled(prev => ({ ...prev, is_show: false }))}
                className="relative z-[9999]"
            >
                {/* Backdrop */}
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-black/70 backdrop-blur-[10px] transition-opacity duration-300 ease-out data-[closed]:opacity-0"
                />

                {/* Full-screen container to center the panel */}
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <div className="flex flex-col items-center justify-center max-h-full w-full">

                        <DialogPanel
                            transition
                            className="relative w-[90%] max-w-lg rounded-2xl bg-white/5 p-[1px] shadow-2xl transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                            style={{
                                backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.3) 100%)`
                            }}
                        >
                            <div ref={modalContainerRef}
                                className='w-full max-h-[60vh] md:max-h-[600px] overflow-y-auto rounded-2xl no-scrollbar'
                                onScroll={handleModalScroll}
                            >
                                <div className="rounded-2xl overflow-hidden" style={{
                                    background: 'radial-gradient(53.11% 56.94% at 50% 50%, #26496A 0%, #182C3F 100%)',
                                    boxShadow: '0px 0px 20px 0px #0000004D'
                                }}>

                                    <div className={`relative w-full ${!modalEnabled?.achievement?.videoUrl?.includes('shorts') ? 'h-[250px] md:h-[320px]' : 'h-[400px] md:h-[600px]'}`}>
                                        <ReactPlayer
                                            ref={playerRef}
                                            key={modalEnabled?.achievement?.videoUrl}
                                            url={modalEnabled?.achievement?.videoUrl?.replace('/shorts/', '/watch?v=')}
                                            width='100%'
                                            height='100%'
                                            playing={true}
                                            loop={true}
                                            controls={true}
                                            muted={isMuted} // Muted by default to allow autoplay
                                            playsinline={true}
                                            onReady={() => {
                                                console.log('✅ Player Ready - forcing play');
                                                try {
                                                    const internal = playerRef.current?.getInternalPlayer();
                                                    if (internal && typeof internal.playVideo === 'function') {
                                                        internal.playVideo();
                                                    }
                                                } catch (e) {
                                                    console.error('Error forcing play:', e);
                                                }
                                            }}
                                            config={{
                                                youtube: {
                                                    // @ts-ignore
                                                    playerVars: {
                                                        disablekb: 1,
                                                        fs: 0,
                                                        modestbranding: 1,
                                                        rel: 0
                                                    } as any
                                                }
                                            }}
                                        />

                                        {/* Mute Button Overlay */}
                                        <div className="absolute bottom-4 right-4 z-50">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleMute();
                                                }}
                                                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                                                aria-label={isMuted ? "Unmute" : "Mute"}
                                            >
                                                <FontAwesomeIcon
                                                    icon={isMuted ? faVolumeMute : faVolumeUp}
                                                    className="text-white text-sm md:text-base"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <div className='p-4 md:p-6'>
                                        <div className='w-full flex justify-start items-center gap-3 mb-4'>
                                            <h3 className='font-bold text-lg text-white'>{modalEnabled?.achievement?.name}</h3>
                                            <img src={modalEnabled?.achievement?.companyModalLogo} alt="" className='h-6 w-auto object-contain' />
                                        </div>

                                        <div className='flex items-center text-sm text-white/90 font-medium gap-3 mb-4 bg-white/5 p-3 rounded-lg'>
                                            <p className="flex-1 text-center">{modalEnabled?.achievement?.from}</p>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-[#70AEFF]" />
                                            <p className="flex-1 text-center">{modalEnabled?.achievement?.to}</p>
                                        </div>

                                        <div className='space-y-3 text-sm text-white/80 leading-relaxed font-light'>
                                            {modalEnabled?.achievement?.description?.split('\n')?.map((item, index) => (
                                                item && <p key={index}>{item}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogPanel>

                        {/* Scroll Arrows */}
                        <motion.div
                            className="mt-4 flex flex-col items-center cursor-pointer pointer-events-auto z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={handleArrowContainerClick}
                        >
                            <div className="bg-[#182C3F] px-4 py-2 rounded-xl flex flex-col -space-y-3 hover:bg-[#233b52] transition-colors shadow-lg border border-white/10">
                                {[0, 0.7, 1.4].map((delay, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: isScrolledDown ? delay : (1.4 - delay)
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={isScrolledDown ? faChevronUp : faChevronDown}
                                            className="text-[#70AEFF] text-sm"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Close Button */}
                        <button
                            className="mt-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 pointer-events-auto z-50 border border-white/10"
                            onClick={() => {
                                setIsMuted(true); // Reset mute state
                                setIsScrolledDown(false);
                                setModalEnabled(prev => ({ ...prev, is_show: false }));
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 13L13 1M1 1L13 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                    </div>
                </div >
            </Dialog >
        </div >
    )
}

export default PlacementSuccessStory
