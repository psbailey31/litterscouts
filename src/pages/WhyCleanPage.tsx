/**
 * Why Clean Our Beaches page - Environmental facts and impact information
 */
export function WhyCleanPage() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(/hero.webp), url(/hero.jpg)' }}
    >
      <div className="min-h-screen bg-gradient-to-b from-blue-900/80 via-blue-800/85 to-blue-900/80">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold text-white sm:text-6xl mb-6 drop-shadow-lg">
              Why Clean Our Beaches?
            </h1>
            <p className="text-2xl text-blue-100 drop-shadow-md max-w-3xl mx-auto">
              Every piece of litter removed is a step toward healthier oceans, thriving wildlife, and a sustainable future
            </p>
          </div>

        {/* Environmental Impact Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-5xl mr-4">🌊</span>
            Our Oceans Are Drowning in Plastic
          </h2>
          <div className="space-y-4 text-gray-700 text-lg">
            <p className="font-semibold text-xl text-blue-900">
              Beach litter isn't just unsightly—it's deadly. Plastic waste takes hundreds of years to decompose, 
              breaking down into microplastics that poison our food chain.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-6">
              <p className="font-bold text-blue-900 text-xl mb-2">The Reality:</p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 text-xl">•</span>
                  <span>Marine animals mistake plastic for food, leading to starvation and death</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 text-xl">•</span>
                  <span>Toxic chemicals leach into water, poisoning entire ecosystems</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 text-xl">•</span>
                  <span>Microplastics are now found in the fish we eat and the water we drink</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 text-xl">•</span>
                  <span>Nesting sites for birds and marine life are destroyed by debris</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Marine Life Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-5xl mr-4">🐢</span>
            100,000+ Lives Lost Every Year
          </h2>
          <div className="space-y-4 text-gray-700 text-lg">
            <p className="font-semibold text-xl text-red-900">
              Over 100,000 marine mammals and sea turtles die annually from plastic. 
              90% of seabirds now have plastic in their stomachs.
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-bold text-red-900 mb-2">🎣 Entanglement</p>
                <p className="text-sm">Fishing nets and lines trap and drown marine animals</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-bold text-red-900 mb-2">🥤 Ingestion</p>
                <p className="text-sm">Turtles mistake plastic bags for jellyfish, leading to starvation</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-bold text-red-900 mb-2">☠️ Poisoning</p>
                <p className="text-sm">Chemical pollutants disrupt reproduction and development</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="font-bold text-red-900 mb-2">👻 Ghost Gear</p>
                <p className="text-sm">Abandoned fishing equipment kills for decades</p>
              </div>
            </div>
          </div>
        </div>

        {/* Renewable Energy Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-5xl mr-4">⚡</span>
            Threatening Ireland's Green Future
          </h2>
          <div className="space-y-4 text-gray-700 text-lg">
            <p className="font-semibold text-xl text-green-900">
              Ireland is leading the way in wave power generation—but marine litter is sabotaging our renewable energy future.
            </p>
            <div className="bg-green-50 border-l-4 border-green-600 p-6 my-6">
              <p className="font-bold text-green-900 text-xl mb-4">How Litter Damages Our Energy Infrastructure:</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 text-2xl font-bold">⚙️</span>
                  <span><strong>Clogs turbines:</strong> Floating debris damages wave energy converters</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 text-2xl font-bold">🔧</span>
                  <span><strong>Increases costs:</strong> Millions spent on debris removal and repairs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 text-2xl font-bold">📉</span>
                  <span><strong>Reduces efficiency:</strong> Fouled equipment generates less power</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 text-2xl font-bold">⚠️</span>
                  <span><strong>Creates hazards:</strong> Installation and maintenance become dangerous</span>
                </li>
              </ul>
              <p className="mt-4 font-semibold text-green-900">
                Clean oceans aren't just good for wildlife—they're essential for Ireland's climate goals.
              </p>
            </div>
          </div>
        </div>

        {/* Economic Impact Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-5xl mr-4">💰</span>
            Costing Communities Millions
          </h2>
          <div className="space-y-4 text-gray-700 text-lg">
            <p className="font-semibold text-xl text-purple-900">
              Polluted beaches don't just hurt nature—they devastate local economies and livelihoods.
            </p>
            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl text-center">
                <p className="text-4xl mb-2">🏖️</p>
                <p className="font-bold text-purple-900 text-lg">Tourism Loss</p>
                <p className="text-sm mt-2">Visitors avoid polluted beaches</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl text-center">
                <p className="text-4xl mb-2">🎣</p>
                <p className="font-bold text-purple-900 text-lg">Fishing Impact</p>
                <p className="text-sm mt-2">Contaminated catches, damaged gear</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl text-center">
                <p className="text-4xl mb-2">🧹</p>
                <p className="font-bold text-purple-900 text-lg">Cleanup Costs</p>
                <p className="text-sm mt-2">Millions spent annually by councils</p>
              </div>
            </div>
          </div>
        </div>

        {/* Human Health Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 transform hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-5xl mr-4">🏥</span>
            It's Personal: Your Health at Risk
          </h2>
          <div className="space-y-4 text-gray-700 text-lg">
            <p className="font-semibold text-xl text-orange-900">
              Beach litter isn't just an environmental issue—it's a direct threat to you and your family.
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-600 p-6 my-6">
              <p className="font-bold text-orange-900 text-xl mb-4">The Dangers Are Real:</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-3 text-xl">🔪</span>
                  <span><strong>Injuries:</strong> Broken glass and sharp metal cause cuts and infections</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-3 text-xl">🍽️</span>
                  <span><strong>Food contamination:</strong> Microplastics are now in the seafood we eat</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-3 text-xl">🦠</span>
                  <span><strong>Disease:</strong> Bacteria and pathogens thrive on marine debris</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-3 text-xl">⚗️</span>
                  <span><strong>Chemical exposure:</strong> Toxic pollutants cause hormonal disruption</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* What You Can Do Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl p-10 text-white transform hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-4xl font-bold mb-6 flex items-center justify-center">
            <span className="text-5xl mr-4">🤝</span>
            You Have the Power to Change This
          </h2>
          <div className="space-y-6">
            <p className="text-xl text-center font-semibold text-blue-100">
              Every action counts. Every piece of litter removed saves a life. Here's how you can be part of the solution:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-8">
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                <p className="text-2xl mb-2">📱</p>
                <p className="font-bold text-lg mb-2">Report Litter</p>
                <p className="text-blue-100 text-sm">Use this platform to document and track pollution patterns</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                <p className="text-2xl mb-2">🧹</p>
                <p className="font-bold text-lg mb-2">Join Cleanups</p>
                <p className="text-blue-100 text-sm">Participate in organized beach cleanup events</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                <p className="text-2xl mb-2">♻️</p>
                <p className="font-bold text-lg mb-2">Reduce Plastic</p>
                <p className="text-blue-100 text-sm">Cut single-use plastics from your daily life</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
                <p className="text-2xl mb-2">📢</p>
                <p className="font-bold text-lg mb-2">Spread the Word</p>
                <p className="text-blue-100 text-sm">Educate others about marine litter impact</p>
              </div>
            </div>
            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl text-center mt-8">
              <p className="text-2xl font-bold mb-2">
                Together, We Can Save Our Beaches
              </p>
              <p className="text-lg">
                Start making a difference today. Report litter, join a cleanup, and protect Ireland's coastline.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default WhyCleanPage;
