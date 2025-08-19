import { db } from './db';
import { schools, cultureCategories } from '@shared/schema';

// Enhanced school information with comprehensive about sections
export async function seedComprehensiveSchoolContent() {
  try {
    // Update Bokaghat Jatiya Vidyalaya with detailed content
    await db.update(schools)
      .set({
        aboutUs: `Bokaghat Jatiya Vidyalaya stands as a beacon of educational excellence in the heart of Assam's Golaghat district. Established with the vision of providing quality education that combines academic rigor with cultural awareness, our institution has been nurturing young minds for decades. We believe that education should not only impart knowledge but also instill values, character, and a deep connection to our cultural heritage.

Our school is committed to creating an inclusive learning environment where every student can thrive regardless of their background or circumstances. We understand that education is the most powerful tool for social transformation, and we work tirelessly to ensure that this tool is accessible to all members of our community.`,

        mission: `To provide holistic education that empowers students with knowledge, critical thinking skills, and moral values while preserving and promoting our rich cultural heritage. We strive to create responsible citizens who can contribute meaningfully to society and lead positive change in their communities.`,

        vision: `To be a center of educational excellence that serves as a model for progressive education in rural India, where students from all backgrounds can access quality education and develop into confident, compassionate, and capable individuals ready to face the challenges of the modern world.`,

        history: `Founded in the early 1980s by visionary educators and community leaders, Bokaghat Jatiya Vidyalaya emerged from a deep commitment to bringing quality education to rural Assam. The school began with a handful of dedicated teachers and a small group of eager students in a modest building. Over the decades, it has grown into a comprehensive educational institution serving hundreds of students across multiple grade levels.

The school's journey has been marked by continuous expansion and improvement. From its humble beginnings with just a few classrooms, it now boasts modern facilities including science laboratories, computer rooms, a well-stocked library, and spacious playgrounds. The institution has weathered various challenges, including natural disasters and economic difficulties, always emerging stronger through the collective efforts of its staff, students, and community supporters.`,

        principalMessage: `Welcome to Bokaghat Jatiya Vidyalaya, where we believe that every child has the potential to achieve greatness. As the principal of this esteemed institution, I am honored to lead a community of dedicated educators who are committed to nurturing the intellectual, emotional, and social development of our students.

Our approach to education goes beyond traditional classroom learning. We encourage our students to question, explore, and discover, fostering a love of learning that will serve them throughout their lives. We also place great emphasis on character development, teaching our students the importance of integrity, empathy, and social responsibility.

I invite you to join our school family, where tradition meets innovation, and where every student is valued and supported in their journey toward academic and personal success.`,

        detailedDescription: `Bokaghat Jatiya Vidyalaya is more than just an educational institution; it is a cornerstone of the local community and a catalyst for positive social change. Located in the scenic Golaghat district of Assam, our school serves a diverse student population drawn from both rural and semi-urban areas.

Our curriculum is designed to meet the highest academic standards while remaining relevant to the local context. We offer comprehensive programs from primary through higher secondary levels, with special attention to science, mathematics, languages, and social studies. Our teachers are carefully selected for their expertise and commitment to student success, and they receive ongoing professional development to stay current with the latest educational methodologies.

The school's infrastructure reflects our commitment to providing a conducive learning environment. Our classrooms are equipped with modern teaching aids, our science laboratories allow for hands-on experimentation, and our library houses an extensive collection of books in multiple languages. We also maintain well-equipped computer facilities to ensure our students are prepared for the digital age.

Beyond academics, we place strong emphasis on extracurricular activities that contribute to the holistic development of our students. Our cultural programs celebrate the rich heritage of Assam while encouraging creative expression. Sports and physical education are integral parts of our curriculum, promoting health, teamwork, and leadership skills.

Community engagement is a fundamental aspect of our educational philosophy. We regularly organize events that bring together students, parents, and community members, fostering a sense of shared responsibility for education. Our students are encouraged to participate in community service projects, developing their understanding of social issues and their role as responsible citizens.`,

        infrastructure: [
          "Modern classroom buildings with adequate ventilation and lighting",
          "Well-equipped science laboratories for physics, chemistry, and biology",
          "Computer laboratory with internet connectivity",
          "Comprehensive library with books in Assamese, English, and Hindi",
          "Spacious auditorium for cultural events and assemblies",
          "Playground facilities for various sports and physical activities",
          "Clean and hygienic restroom facilities",
          "Safe drinking water systems throughout the campus",
          "Administrative offices and staff rooms",
          "First aid facilities and health check-up arrangements"
        ],

        extracurriculars: [
          "Cultural dance and music programs celebrating Assamese heritage",
          "Debate and public speaking competitions",
          "Science and mathematics olympiads",
          "Inter-school sports competitions in cricket, football, and athletics",
          "Environmental awareness and tree plantation drives",
          "Community service and social awareness programs",
          "Literary activities including poetry and story writing",
          "Art and craft workshops",
          "Student government and leadership development programs",
          "Annual cultural festivals and educational exhibitions"
        ]
      })
      .where({ name: 'Bokaghat Jatiya Vidyalaya' });

    // Update Brahmaputra Jatiya Vidyalaya with comprehensive content
    await db.update(schools)
      .set({
        aboutUs: `Brahmaputra Jatiya Vidyalaya, named after the mighty river that flows through the heart of Assam, embodies the spirit of continuous flow of knowledge and wisdom. Our institution stands as a testament to the power of education in transforming lives and communities. Since our establishment, we have been dedicated to providing students with not just academic excellence but also the tools they need to become thoughtful, engaged citizens.

We pride ourselves on our inclusive approach to education, welcoming students from diverse backgrounds and creating an environment where every voice is heard and valued. Our commitment extends beyond the classroom, as we work closely with families and the broader community to ensure that our educational mission has lasting impact.`,

        mission: `To nurture academically excellent, socially conscious, and culturally rooted individuals who can think critically, act compassionately, and lead with integrity. We aim to bridge traditional wisdom with modern knowledge, preparing our students for success in an interconnected world.`,

        vision: `To establish ourselves as a premier educational institution that serves as a model for innovative, inclusive, and culturally sensitive education, producing graduates who are not only successful in their chosen fields but also committed to the betterment of society.`,

        history: `Brahmaputra Jatiya Vidyalaya was established in the late 1980s by a group of educators and social activists who recognized the urgent need for quality educational opportunities in their region. The school's founding was inspired by the belief that education should be accessible to all, regardless of economic or social status.

The early years were challenging, with limited resources and infrastructure. However, the dedication of the founding members and the strong support from the local community enabled the school to not only survive but thrive. Over the years, the institution has expanded its facilities, improved its curriculum, and attracted talented educators who share its vision.

Today, Brahmaputra Jatiya Vidyalaya stands as one of the most respected educational institutions in the region, known for its academic excellence, cultural programs, and commitment to social justice. The school has produced numerous alumni who have gone on to achieve success in various fields while maintaining their connection to their roots and their commitment to community service.`,

        principalMessage: `It is with great pride and responsibility that I serve as the principal of Brahmaputra Jatiya Vidyalaya. Our school represents the hopes and dreams of countless families who believe in the transformative power of education. Every day, I am inspired by the enthusiasm of our students and the dedication of our staff.

Our educational philosophy is rooted in the belief that learning should be joyful, meaningful, and relevant to students' lives. We strive to create an environment where students feel safe to take intellectual risks, express their creativity, and develop their unique talents. We also emphasize the importance of service to others and stewardship of our environment.

As we look to the future, we remain committed to our founding principles while embracing innovation and change. We invite you to join us in this exciting educational journey, where tradition and progress work hand in hand to create a brighter future for all.`,

        detailedDescription: `Set against the backdrop of Assam's natural beauty, Brahmaputra Jatiya Vidyalaya offers a comprehensive educational experience that prepares students for the challenges and opportunities of the 21st century. Our curriculum is carefully designed to balance academic rigor with creative expression, critical thinking with practical skills, and individual achievement with collective responsibility.

The school serves students from grades 1 through 12, offering both general and specialized streams in the higher grades. Our teaching methodology combines traditional pedagogical approaches with innovative techniques, ensuring that students with different learning styles can succeed. We place particular emphasis on multilingual education, recognizing the importance of preserving local languages while developing proficiency in national and international languages.

Our faculty consists of highly qualified educators who are passionate about their subjects and committed to student success. They participate in regular professional development programs and collaborate closely to ensure that our curriculum is integrated and coherent across all subjects and grade levels.

The school's facilities reflect our commitment to providing a world-class educational experience. Our campus includes modern classrooms, specialized laboratories, a comprehensive library, and recreational facilities. We also maintain strong partnerships with local organizations and institutions, providing our students with opportunities for internships, field studies, and community engagement.

Technology integration is a key component of our educational approach. We believe that digital literacy is essential for success in the modern world, and we ensure that our students are comfortable and competent with various technologies while also understanding their responsible use.`,

        infrastructure: [
          "State-of-the-art classroom facilities with smart boards and projectors",
          "Advanced science laboratories with modern equipment and safety measures",
          "Computer center with high-speed internet and latest software",
          "Extensive library with digital resources and reading spaces",
          "Multi-purpose auditorium with sound and lighting systems",
          "Sports complex with facilities for indoor and outdoor games",
          "Cafeteria providing nutritious meals and snacks",
          "Medical facility with qualified nursing staff",
          "Transportation services covering wide area",
          "Hostel facilities for outstation students"
        ],

        extracurriculars: [
          "Traditional Assamese cultural programs and festivals",
          "Model United Nations and debate competitions",
          "Science fair and innovation challenges",
          "Sports tournaments in cricket, football, basketball, and volleyball",
          "Environmental conservation and sustainability projects",
          "Community outreach and social service initiatives",
          "Music and dance academies",
          "Drama and theater productions",
          "Student newspaper and media club",
          "Career guidance and skill development workshops"
        ]
      })
      .where({ name: 'Brahmaputra Jatiya Vidyalaya' });

    // Update Mahuramukh Jatiya Vidyalaya
    await db.update(schools)
      .set({
        aboutUs: `Mahuramukh Jatiya Vidyalaya stands proudly in the scenic landscape of Assam, representing decades of commitment to educational excellence and community service. Our school was founded on the principle that quality education should be accessible to all children, regardless of their socioeconomic background. We have remained true to this vision while continuously evolving to meet the changing needs of our students and community.

Our institution is known for its warm, nurturing environment where students feel valued and supported. We believe that every child has unique potential, and our role is to help them discover and develop their talents. Through our comprehensive programs, we aim to produce not just academically successful students, but well-rounded individuals who are prepared to make positive contributions to society.`,

        mission: `To provide accessible, high-quality education that empowers students with knowledge, skills, and values necessary for personal success and social responsibility. We are committed to fostering critical thinking, creativity, and cultural appreciation while preparing students for higher education and meaningful careers.`,

        vision: `To be recognized as a leading educational institution that successfully combines academic excellence with character development, producing graduates who are confident, compassionate, and capable of making positive impacts in their communities and beyond.`,

        history: `The story of Mahuramukh Jatiya Vidyalaya begins in the early 1990s when a group of dedicated community members recognized the urgent need for a quality educational institution in their area. With limited resources but unlimited determination, they established what would become one of the region's most respected schools.

The early years required tremendous sacrifice and perseverance from founders, teachers, and families. Classes were initially held in borrowed buildings, and teachers often worked without adequate compensation because they believed in the mission. Gradually, through community support and the school's growing reputation for excellence, proper facilities were constructed and quality staff was recruited.

Today, the school stands as a testament to what can be achieved when a community comes together with a shared vision. Our alumni have gone on to pursue successful careers in various fields, many returning to contribute to their home communities. The school continues to evolve, incorporating new technologies and methodologies while maintaining its core commitment to accessible, quality education.`,

        principalMessage: `Welcome to Mahuramukh Jatiya Vidyalaya, where we believe that education is the cornerstone of individual growth and social progress. As principal, I am privileged to lead an institution that has touched the lives of thousands of students over the years, helping them realize their dreams and potential.

Our approach to education is holistic, recognizing that students learn best when they feel supported, challenged, and valued. We strive to create an environment where academic excellence goes hand in hand with personal development, where students learn not just facts and skills but also empathy, integrity, and social responsibility.

I invite you to explore what our school has to offer and to consider becoming part of our educational family. Together, we can continue building on our legacy of excellence while preparing for an even brighter future.`,

        detailedDescription: `Nestled in the heart of rural Assam, Mahuramukh Jatiya Vidyalaya serves as an educational beacon for the surrounding communities. Our school offers comprehensive education from primary through higher secondary levels, with a curriculum that balances academic rigor with practical skills and cultural awareness.

Our teaching philosophy is student-centered, recognizing that each child learns differently and at their own pace. We employ a variety of instructional methods to accommodate different learning styles, ensuring that all students have the opportunity to succeed. Our teachers are not just instructors but mentors who take personal interest in each student's academic and personal development.

The school's academic programs are designed to prepare students for higher education while also providing practical skills that will serve them well in any career path they choose. We offer strong programs in science, mathematics, languages, and social studies, supplemented by courses in computer science, environmental studies, and life skills.

Cultural education is an integral part of our curriculum, as we believe students should be proud of their heritage while being prepared for a globalized world. We regularly organize cultural events that celebrate local traditions while also exposing students to diverse perspectives and experiences.

Our commitment to excellence extends beyond academics to include character development, leadership training, and community service. We believe that true education must prepare students not just for personal success but for meaningful contribution to society.`,

        infrastructure: [
          "Well-designed classroom buildings with proper ventilation and lighting",
          "Science laboratories equipped for practical experiments",
          "Computer room with internet access and modern software",
          "Library stocked with books in multiple languages and subjects",
          "Assembly hall for school gatherings and cultural events",
          "Playground areas for various sports and physical activities",
          "Clean restroom facilities maintained to high hygiene standards",
          "Safe drinking water systems throughout the campus",
          "Administrative block with offices and meeting rooms",
          "First aid room with basic medical supplies and equipment"
        ],

        extracurriculars: [
          "Traditional folk dance and music programs",
          "Inter-house competitions in various academic and cultural activities",
          "Science exhibitions and project presentations",
          "Sports competitions including athletics, cricket, and traditional games",
          "Environmental awareness campaigns and tree planting activities",
          "Community service projects and social awareness programs",
          "Literary competitions including essay writing and poetry recitation",
          "Arts and crafts workshops showcasing local traditions",
          "Leadership development programs for senior students",
          "Annual day celebrations and educational field trips"
        ]
      })
      .where({ name: 'Mahuramukh Jatiya Vidyalaya' });

    console.log('✅ Successfully updated comprehensive school content');
  } catch (error) {
    console.error('❌ Error updating school content:', error);
    throw error;
  }
}

// Enhanced cultural program information
export async function seedComprehensiveCulturalContent() {
  try {
    // Update Music program
    await db.update(cultureCategories)
      .set({
        aboutSection: `Our Music program is dedicated to preserving and promoting the rich musical heritage of Northeast India while fostering contemporary musical expression. We believe that music is a universal language that can bridge cultures, heal communities, and inspire personal growth. Our comprehensive curriculum covers traditional Assamese folk music, classical Indian music, and contemporary styles, providing students with a well-rounded musical education.

The program emphasizes both theoretical knowledge and practical skills, ensuring that students understand the cultural context and historical significance of the music they learn. We maintain a collection of traditional instruments and provide training in their use, while also incorporating modern musical technology and instruments.`,

        objectives: [
          "Preserve and promote traditional Assamese and Northeast Indian musical forms",
          "Develop technical proficiency in vocal and instrumental music",
          "Foster creativity and self-expression through musical composition and performance",
          "Build confidence through public performances and musical collaborations",
          "Integrate music education with broader cultural and historical learning",
          "Prepare talented students for advanced musical studies and professional careers"
        ],

        activities: [
          "Traditional folk singing classes focusing on Assamese Bihu songs and devotional music",
          "Instrumental training in tabla, harmonium, flute, and traditional Assamese instruments",
          "Western musical instruments including guitar, keyboard, and drums",
          "Music theory and composition workshops",
          "Choir and ensemble performances",
          "Recording and music production sessions",
          "Concerts and musical performances for the community",
          "Music therapy sessions for stress relief and emotional well-being"
        ],

        instructorInfo: `Our music faculty consists of accomplished musicians and educators who bring decades of experience in both traditional and contemporary music. Our lead instructor is a master of classical Indian music with extensive training in the Hindustani tradition, while our folk music specialist has spent years learning directly from traditional Assamese musicians. We also have visiting artists who conduct workshops and masterclasses, exposing our students to diverse musical traditions and contemporary techniques.`,

        scheduleInfo: `Music classes are offered six days a week with different programs for different age groups and skill levels. Beginner classes meet twice a week for 90 minutes each session, while advanced students may participate in daily practice sessions. We also offer intensive workshops during school holidays and summer camps for students who want to accelerate their learning.`,

        requirements: `No prior musical experience is required for beginner classes. Students should bring enthusiasm, dedication, and willingness to practice regularly. For intermediate and advanced classes, basic musical knowledge is helpful but not mandatory. All instruments and materials are provided by the program.`,

        achievements: [
          "First place in state-level folk music competition for three consecutive years",
          "Successful performances at major cultural festivals across Northeast India",
          "Several students have gone on to pursue professional music careers",
          "Regular invitations to perform at community celebrations and cultural events",
          "Recognition from local government for contributions to cultural preservation",
          "Collaboration with professional musicians and recording artists"
        ],

        history: `The Music program was established in 1995 as part of our commitment to preserving Assamese cultural traditions. Initially focused solely on traditional folk music, the program has expanded over the years to include classical Indian music, contemporary styles, and music technology. The program has been instrumental in reviving interest in traditional Assamese musical forms among young people.`,

        philosophy: `We believe that music education should be holistic, addressing not just technical skills but also cultural understanding, emotional expression, and social connection. Our teaching approach emphasizes the joy of music-making while maintaining respect for traditional forms and encouraging innovative expression. We see music as a powerful tool for building community and fostering personal growth.`
      })
      .where({ name: 'Music' });

    // Update Fine Arts program
    await db.update(cultureCategories)
      .set({
        aboutSection: `The Fine Arts program at Prayas Study Circle celebrates the visual arts traditions of Northeast India while encouraging contemporary artistic expression. We provide comprehensive training in various artistic mediums, from traditional painting and sculpture to modern digital arts. Our program is designed to develop both technical skills and creative vision, helping students express themselves while connecting with their cultural heritage.

Our approach emphasizes experimentation and personal expression while building strong foundational skills. Students learn about art history, color theory, composition, and various techniques while being encouraged to develop their unique artistic voice. We believe that art education contributes to overall cognitive development and emotional well-being.`,

        objectives: [
          "Develop technical proficiency in various artistic mediums and techniques",
          "Foster creativity, imagination, and personal artistic expression",
          "Preserve and promote traditional Northeast Indian visual arts",
          "Build appreciation for art history and cultural contexts",
          "Prepare students for careers in art, design, and related fields",
          "Use art as a tool for community engagement and social commentary"
        ],

        activities: [
          "Traditional painting techniques including miniature and folk art styles",
          "Modern painting in watercolor, acrylic, and oil mediums",
          "Sculpture and pottery using local clay and materials",
          "Digital art and graphic design using computer software",
          "Printmaking including woodblock and screen printing",
          "Photography and photo editing workshops",
          "Art exhibitions showcasing student work",
          "Community mural projects and public art installations"
        ],

        instructorInfo: `Our fine arts faculty includes professional artists, art educators, and cultural specialists. Our head instructor is a renowned painter who has exhibited work nationally and internationally, bringing both technical expertise and contemporary perspectives to the program. We also have specialists in traditional crafts who work to preserve and teach ancestral artistic techniques.`,

        scheduleInfo: `Fine Arts classes are offered throughout the week with flexible scheduling to accommodate different age groups and commitment levels. Basic classes meet twice weekly for two-hour sessions, while advanced students may participate in intensive studio sessions. Special workshops and artist residencies are organized periodically.`,

        requirements: `No previous art experience is necessary for beginning classes. Students should bring enthusiasm for visual expression and willingness to experiment with different mediums. All basic art supplies are provided, though advanced students may choose to purchase their own professional-grade materials.`,

        achievements: [
          "Student artworks displayed in regional galleries and exhibitions",
          "Winners of numerous state and national youth art competitions",
          "Successful community art projects that have beautified public spaces",
          "Alumni working as professional artists, designers, and art educators",
          "Recognition for preserving and promoting traditional artistic techniques",
          "Collaboration with museums and cultural institutions"
        ],

        history: `Established in 1998, the Fine Arts program began with a focus on preserving traditional Assamese painting and craft techniques. Over the years, it has evolved to include contemporary art forms while maintaining its commitment to cultural preservation. The program has been instrumental in documenting and teaching traditional artistic methods that were at risk of being lost.`,

        philosophy: `We believe that art education should nurture both technical skill and creative thinking. Our teaching philosophy emphasizes experimentation, cultural appreciation, and personal expression. We see art as a powerful means of communication that can bridge differences and build understanding between communities. We encourage students to use their artistic skills for both personal fulfillment and social contribution.`
      })
      .where({ name: 'Fine Arts' });

    // Update Dance program
    await db.update(cultureCategories)
      .set({
        aboutSection: `Our Dance program celebrates the rich tradition of Northeast Indian dance forms while encouraging contemporary choreographic expression. We offer comprehensive training in classical, folk, and contemporary dance styles, with particular emphasis on Assamese traditional dances such as Bihu, Sattriya, and various tribal dance forms. Our program recognizes dance as both an art form and a means of cultural preservation and community building.

The curriculum is designed to develop physical fitness, artistic expression, cultural awareness, and performance skills. Students learn not just dance techniques but also the historical and cultural contexts of the dances they perform. We believe that dance education contributes to overall personal development, building confidence, discipline, and appreciation for cultural heritage.`,

        objectives: [
          "Preserve and promote traditional Northeast Indian dance forms",
          "Develop technical proficiency in various dance styles and techniques",
          "Build physical fitness, flexibility, and body awareness",
          "Foster artistic expression and creative choreography skills",
          "Prepare students for professional dance careers and higher education in performing arts",
          "Use dance as a medium for cultural education and community engagement"
        ],

        activities: [
          "Traditional Assamese Bihu dance classes for all age groups",
          "Classical Sattriya dance training with certified instructors",
          "Folk dances from various Northeast Indian communities",
          "Contemporary and modern dance workshops",
          "Choreography classes for advanced students",
          "Dance fitness and conditioning sessions",
          "Performance opportunities at cultural festivals and events",
          "Dance therapy sessions for wellness and stress relief"
        ],

        instructorInfo: `Our dance faculty includes certified instructors in classical Sattriya dance, experienced folk dance performers, and contemporary choreographers. Our lead instructor is a recognized master of traditional Assamese dance forms with over 20 years of teaching experience. We regularly host guest instructors and visiting artists who bring specialized knowledge and fresh perspectives to our program.`,

        scheduleInfo: `Dance classes are offered six days a week with separate sessions for different age groups and skill levels. Beginner classes meet twice weekly for 90-minute sessions, while advanced students participate in daily practice. Intensive workshops and performance preparation sessions are scheduled as needed throughout the year.`,

        requirements: `No previous dance experience is required for beginner classes. Students should wear comfortable clothing that allows for movement and bring a water bottle. We recommend regular attendance and practice for optimal progress. For advanced classes, basic dance knowledge and physical fitness are helpful.`,

        achievements: [
          "Champion performances at state and national cultural competitions",
          "Regular invitations to perform at major festivals and celebrations",
          "Several students have received scholarships for advanced dance education",
          "Recognition from cultural organizations for preservation of traditional dance forms",
          "Successful tours and performances in other states and regions",
          "Mentoring of younger students and community dance groups"
        ],

        history: `The Dance program was founded in 1996 with the mission of preserving traditional Assamese dance forms that were at risk of being forgotten. Starting with a small group of dedicated students and one instructor, the program has grown to become one of the most respected dance education programs in the region. It has played a crucial role in reviving interest in traditional dances among young people.`,

        philosophy: `We approach dance education as a holistic practice that develops body, mind, and spirit. Our teaching philosophy emphasizes respect for traditional forms while encouraging personal expression and innovation. We believe that dance is a powerful medium for storytelling, cultural transmission, and community building. We encourage students to see themselves as guardians of cultural heritage and ambassadors for their traditions.`
      })
      .where({ name: 'Dance' });

    console.log('✅ Successfully updated comprehensive cultural content');
  } catch (error) {
    console.error('❌ Error updating cultural content:', error);
    throw error;
  }
}

// Run both seeding functions
export async function seedAllComprehensiveContent() {
  await seedComprehensiveSchoolContent();
  await seedComprehensiveCulturalContent();
}