import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Home() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await api.get('/home/');
        setSections(response.data);
      } catch (error) {
        console.error("Failed to fetch home sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-stone-900 text-amber-50 flex items-center justify-center">Loading...</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-stone-900 text-amber-50 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">Under Construction</h1>
        <p className="text-stone-300">The Bitzantine Empire homepage is currently being renovated.</p>
      </div>
    );
  }

  const getSection = (key) => sections.find(s => s.section_key === key);

  const heroSection = getSection('hero');
  const democracySection = getSection('democracy');
  const militarySection = getSection('military');
  const craftingSection = getSection('crafting');
  const recruitmentMilitary = getSection('recruitment_military');
  const recruitmentIndustry = getSection('recruitment_industry');
  
  const otherSections = sections.filter(s => ![
    'hero', 'democracy', 'military', 'crafting', 'recruitment_military', 'recruitment_industry'
  ].includes(s.section_key));

  return (
    <div className="min-h-screen bg-stone-900 text-amber-50">
      {/* Hero Section */}
      {heroSection && (
        <div 
          className="relative h-[80vh] flex items-center justify-center bg-stone-800 bg-cover bg-center"
          style={{ backgroundImage: heroSection.image_url ? `url(${heroSection.image_url})` : 'none' }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-amber-500 mb-4 drop-shadow-lg font-serif tracking-wider">
              {heroSection.title}
            </h1>
            {heroSection.subtitle && (
              <h2 className="text-xl sm:text-2xl md:text-3xl text-amber-200 mb-6 font-light tracking-wide uppercase border-b-2 border-amber-500/50 inline-block pb-2">
                {heroSection.subtitle}
              </h2>
            )}
            <p className="text-lg sm:text-xl text-stone-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              {heroSection.content}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              {heroSection.cta_link && (
                <Link to={heroSection.cta_link} className="bg-amber-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-sm font-bold hover:bg-amber-700 transition-all transform hover:scale-105 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  {heroSection.cta_text || "Join Us"}
                </Link>
              )}
              <Link to="/lore" className="bg-stone-800/80 backdrop-blur-sm border-2 border-amber-600 text-amber-500 hover:bg-amber-900/40 font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-sm transition-all hover:text-amber-400">
                Read Our History
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {democracySection && (
            <div className="bg-stone-800 p-6 sm:p-8 rounded-lg border border-stone-700 text-center hover:border-amber-500 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] group">
              <div className="text-4xl sm:text-5xl text-amber-500 mb-6 group-hover:scale-110 transition-transform duration-300">🏛️</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-amber-100 font-serif">{democracySection.title}</h3>
              <p className="text-stone-400 leading-relaxed">{democracySection.content}</p>
            </div>
          )}
          
          {craftingSection && (
            <div className="bg-stone-800 p-6 sm:p-8 rounded-lg border border-stone-700 text-center hover:border-amber-500 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] group">
              <div className="text-4xl sm:text-5xl text-amber-500 mb-6 group-hover:scale-110 transition-transform duration-300">⚒️</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-amber-100 font-serif">{craftingSection.title}</h3>
              <p className="text-stone-400 leading-relaxed">{craftingSection.content}</p>
            </div>
          )}
          
          <div className="bg-stone-800 p-6 sm:p-8 rounded-lg border border-stone-700 text-center hover:border-amber-500 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] group">
            <div className="text-4xl sm:text-5xl text-amber-500 mb-6 group-hover:scale-110 transition-transform duration-300">🤝</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-amber-100 font-serif">Community First</h3>
            <p className="text-stone-400 leading-relaxed">A welcoming environment where every member's contribution matters to the empire's success.</p>
          </div>
        </div>
      </div>

      {/* Lore / Conflict Section */}
      {militarySection && (
        <div className="bg-stone-950 py-16 sm:py-20 border-y border-stone-800 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
             <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
               <div className="md:w-1/2 text-center md:text-left">
                 <h2 className="text-3xl sm:text-4xl font-bold text-red-500 mb-2 font-serif tracking-wide">{militarySection.title}</h2>
                 <h3 className="text-xl sm:text-2xl text-stone-400 mb-6">{militarySection.subtitle}</h3>
                 <p className="text-base sm:text-lg text-stone-300 mb-8 leading-relaxed">
                   {militarySection.content}
                 </p>
                 <Link to="/lore" className="text-red-400 hover:text-red-300 font-bold uppercase tracking-widest border-b border-red-500 pb-1 hover:border-red-300 transition-colors">
                   Learn About The War &rarr;
                 </Link>
               </div>
               <div className="md:w-1/2 w-full mt-8 md:mt-0 bg-stone-900 p-1 border border-stone-700 md:rotate-1 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                  {militarySection.image_url ? (
                    <img src={militarySection.image_url} alt="War" className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-64 bg-stone-800 flex items-center justify-center text-stone-600">No Image Available</div>
                  )}
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Recruitment Split Section */}
      <div className="flex flex-col md:flex-row min-h-[500px]">
        {recruitmentMilitary && (
          <div className="md:w-1/2 bg-stone-800 flex items-center justify-center p-8 sm:p-12 border-b md:border-b-0 md:border-r border-stone-700 relative group overflow-hidden">
            <div className="absolute inset-0 bg-amber-900/10 group-hover:bg-amber-900/20 transition-colors"></div>
            <div className="relative z-10 text-center">
              <div className="text-5xl sm:text-6xl mb-6">⚔️</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-500 mb-4 font-serif">{recruitmentMilitary.title}</h2>
              <p className="text-stone-300 mb-8 max-w-md mx-auto">{recruitmentMilitary.content}</p>
              <Link to={recruitmentMilitary.cta_link || '#'} className="inline-block border-2 border-amber-600 text-amber-500 px-6 py-3 sm:px-8 sm:py-3 font-bold hover:bg-amber-600 hover:text-white transition-all">
                {recruitmentMilitary.cta_text}
              </Link>
            </div>
          </div>
        )}
        {recruitmentIndustry && (
          <div className="md:w-1/2 bg-stone-900 flex items-center justify-center p-8 sm:p-12 relative group overflow-hidden">
            <div className="absolute inset-0 bg-blue-900/5 group-hover:bg-blue-900/10 transition-colors"></div>
            <div className="relative z-10 text-center">
              <div className="text-5xl sm:text-6xl mb-6">⚒️</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-400 mb-4 font-serif">{recruitmentIndustry.title}</h2>
              <p className="text-stone-300 mb-8 max-w-md mx-auto">{recruitmentIndustry.content}</p>
              <Link to={recruitmentIndustry.cta_link || '#'} className="inline-block border-2 border-blue-500 text-blue-400 px-6 py-3 sm:px-8 sm:py-3 font-bold hover:bg-blue-600 hover:text-white transition-all">
                {recruitmentIndustry.cta_text}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Other Dynamic Sections */}
      {otherSections.map(section => (
        <div key={section.id} className="py-12 sm:py-16 px-4 bg-stone-900 border-t border-stone-800">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-500 mb-6 font-serif">{section.title}</h2>
            {section.subtitle && <h3 className="text-lg sm:text-xl text-stone-400 mb-4">{section.subtitle}</h3>}
            <div className="prose prose-invert prose-amber mx-auto">
              <p className="text-base sm:text-lg text-stone-300">{section.content}</p>
            </div>
            {section.image_url && (
              <img src={section.image_url} alt={section.title} className="mt-8 mx-auto rounded-lg shadow-lg max-h-96 object-cover" />
            )}
            {section.cta_link && (
              <div className="mt-8">
                <Link to={section.cta_link} className="bitz-btn">
                  {section.cta_text || "Learn More"}
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
