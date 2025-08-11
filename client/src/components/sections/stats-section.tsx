import dilipPhukan from "@assets/Dilip phukan_1754924693932.jpg";
import nijoraBot from "@assets/Nijora borthakur_1754924731273.jpg";
import amarKakoty from "@assets/Amar kakoty_1754924777602.jpg";
import ajantaRajkhowa from "@assets/Ajanta Rajkhowa_1754924777601.jpg";
import soneswarNarah from "@assets/Soneswar Narah_1754924810787.jpg";
import bijuChautal from "@assets/Biju Chautal_1754925020183.jpg";

export default function StatsSection() {
  const leadershipTeam = [
    {
      name: "Dilip Pookhan",
      position: "Chief Advisor",
      image: dilipPhukan,
    },
    {
      name: "Nijora Borthakur",
      position: "President",
      image: nijoraBot,
    },
    {
      name: "Amar Kakoty",
      position: "Vice President",
      image: amarKakoty,
    },
    {
      name: "Ajanta Rajkhowa",
      position: "Vice President",
      image: ajantaRajkhowa,
    },
    {
      name: "Soneswar Narah",
      position: "Chief Secretary",
      image: soneswarNarah,
    },
    {
      name: "Biju Choutal",
      position: "Treasurer",
      image: bijuChautal,
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Leadership Team</h2>
          <p className="text-lg text-gray-600">Dedicated leaders driving educational and cultural transformation</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {leadershipTeam.map((leader, index) => (
            <div key={index} className="text-center">
              <div className="mb-4">
                <img 
                  src={leader.image} 
                  alt={leader.name}
                  className={`w-24 h-24 rounded-full mx-auto border-4 border-red-100 shadow-lg hover:border-red-300 transition-colors ${
                    leader.name === "Dilip Pookhan" 
                      ? "object-cover object-left-top" 
                      : "object-cover"
                  }`}
                />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{leader.name}</h4>
              <p className="text-xs text-red-600 font-medium">{leader.position}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
