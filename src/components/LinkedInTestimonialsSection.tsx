import React, { useRef } from 'react';

interface LinkedInTestimonialsSectionProps {
    className?: string;
    role?: string;
}

const LinkedInTestimonialsSection: React.FC<LinkedInTestimonialsSectionProps> = ({ className = '', role = 'Professional' }) => {

    // Data (Migrated from linkedInData.js)
    const linkedInData = [
        {
            name: 'Nikhil Singh',
            profileImage: 'https://assets.learntube.ai/files/linkedinpost/1642956606077.jpg?updatedAt=1745563756773',
            role: 'Quality Assurance Senior Associate',
            description: `I earned my certification for completing the ${role} assessment by <strong style="color: #006FBC;">LearnTube.ai!</strong> (Career Ninja's Digital Institute).`,
            certificateImage: 'https://assets.learntube.ai/files/linkedinpost/1728502748455.jpg?updatedAt=1745564160454',
            companyImage: 'https://assets.learntube.ai/files/New%20Recognised%20Section/www_google_com-logo-dark_white.png?updatedAt=1746275913923',
            headerStyle: 'background: #4289FB;',
        },
        {
            name: 'Sainath Bavandlapally',
            profileImage: 'https://assets.learntube.ai/files/linkedinpost/1744035431494.jpg?updatedAt=1745562294597',
            role: 'Senior Associate - II',
            description: `I'm happy to share that I've obtained a new certification: ${role} Certification from <strong style="color: #006FBC;">LearnTube.ai!</strong>`,
            certificateImage: 'https://assets.learntube.ai/files/linkedinpost/1718599743366.jpg?updatedAt=1745563304970',
            companyImage: 'https://assets.learntube.ai/files/New%20Recognised%20Section/www_amazon_com-logo-light.svg_white.png?updatedAt=1746275290329',
            headerStyle: 'background: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%), #FB9900;',
        },
        {
            name: 'Aditya Bagdare',
            profileImage: 'https://assets.learntube.ai/files/linkedinpost/1735931454957.jpg?updatedAt=1745564600977',
            role: `${role}`,
            description: `I'm happy to share that I've obtained a new certification: Management Strategies from <strong style="color: #006FBC;">LearnTube.ai!</strong>`,
            certificateImage: 'https://assets.learntube.ai/files/linkedinpost/1712893173546.jpg?updatedAt=1745564702546',
            companyImage: 'https://assets.learntube.ai/files/New%20Recognised%20Section/www_fedex_com-logo-light_wh.png?updatedAt=1746276048402',
            headerStyle: 'background: linear-gradient(to right, #FA7204 0%, #4E1587 100%);',
        },
        {
            name: 'Karthik V',
            profileImage: 'https://assets.learntube.ai/files/linkedinpost/1605015867066.jpg?updatedAt=1745565048101',
            role: 'Sr.Chief Engineer',
            description: `I'm happy to share that I've obtained a new certification: Certified Associate in Management (CAM) from <strong style="color: #006FBC;">LearnTube.ai!</strong>`,
            certificateImage: 'https://assets.learntube.ai/files/linkedinpost/1724848145069.jpg?updatedAt=1745565153918',
            companyImage: 'https://assets.learntube.ai/files/New%20Recognised%20Section/samsung_com-logo-light.svg_white.png?updatedAt=1746276215765',
            headerStyle: 'background: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%), #152497;',
        },
        {
            name: 'Kumar Saurav',
            profileImage: 'https://assets.learntube.ai/files/linkedinpost/1739813957095.jpg?updatedAt=1745565522867',
            role: 'Senior Project Consultant',
            description: `I'm happy to share that I've obtained a new certification: ${role} Certifications from <strong style="color: #006FBC;">LearnTube.ai!</strong>`,
            certificateImage: 'https://assets.learntube.ai/files/linkedinpost/1707986218041.jpg?updatedAt=1745565720472',
            companyImage: 'https://assets.learntube.ai/files/New%20Recognised%20Section/www_ey_com-logo-light_wh.png?updatedAt=1746276403856',
            headerStyle: 'background: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%), #D6DF24;',
        },
        {
            name: 'Akash Goswami',
            profileImage: 'https://assets.learntube.ai/files/linkedinpost/1740207031737.jpg?updatedAt=1745565913023',
            role: 'Senior Technology Specialist',
            description: `I'm happy to share that I've obtained a new certification: ${role} basic quiz from <strong style="color: #006FBC;">LearnTube.ai!</strong>`,
            certificateImage: 'https://assets.learntube.ai/files/linkedinpost/Group%2022086%20(1).jpg?updatedAt=1746154368636',
            companyImage: 'https://assets.learntube.ai/files/New%20Recognised%20Section/www_deloitte_com-logo-dark.svg_white.png?updatedAt=1746276563772',
            headerStyle: 'background: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%), #7CB123;',
        }
    ];

    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <section className={`w-full py-8 ${className}`}>
            {/* Section Header */}
            <div className="text-center mb-8 px-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Trusted By <span className="text-[#4FC3F7]">10L+ Professionals</span> At <span className="text-[#4FC3F7]">Top Companies</span>
                </h2>
                <div className="h-1 w-16 bg-[#4FC3F7] rounded-full mx-auto"></div>
            </div>

            {/* Horizontal Scroll Container */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 px-4 sm:px-8 pb-8 snap-x snap-mandatory scrollbar-hide -mx-2 sm:mx-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {linkedInData.map((post, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200"
                    >
                        {/* Header Bar */}
                        <div className="h-2 w-full" style={{ background: post.headerStyle.replace('background: ', '').replace(';', '') }}></div>

                        <div className="p-4">
                            {/* User Header */}
                            <div className="flex gap-3 mb-3">
                                <img src={post.profileImage} alt={post.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                <div>
                                    <h4 className="text-gray-900 font-bold text-sm leading-tight">{post.name}</h4>
                                    <p className="text-gray-500 text-xs leading-tight mt-0.5">{post.role}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LI" className="w-3 h-3" />
                                        <span className="text-xs text-gray-400">1w • </span>
                                        <svg className="w-3 h-3 text-gray-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 7 7 7 7 0 0 0-7-7zM8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4.5a.5.5 0 0 1 0-1h3V4.5A.5.5 0 0 1 8 4z" /></svg>
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    {post.companyImage && <img src={post.companyImage} alt="Company" className="h-6 w-auto object-contain brightness-0 opacity-50" />}
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-700 text-xs sm:text-sm mb-3 line-clamp-3" dangerouslySetInnerHTML={{ __html: post.description }}></p>

                            {/* Certificate Image */}
                            <div className="rounded-lg overflow-hidden border border-gray-100 mb-3">
                                <img src={post.certificateImage} alt="Certificate" className="w-full h-auto object-cover" />
                            </div>

                            {/* Likes/Comments (Visual only) */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-1">
                                    <div className="flex -space-x-1">
                                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white">
                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                                        </div>
                                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white">
                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">24</span>
                                </div>
                                <span className="text-xs text-gray-500">4 comments</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default LinkedInTestimonialsSection;
