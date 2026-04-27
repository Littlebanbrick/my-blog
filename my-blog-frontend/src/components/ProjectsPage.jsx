import { Link } from 'react-router-dom';

const projects = [
{ id: 1, name: 'LexiMind', desc: 'AI-Powered TOEFL English Learning Web App', link: 'https://github.com/Littlebanbrick/LexiMind' },
{ id: 2, name: 'Diaries', desc: 'A simple local diary-repository web application based on html,css,javascript,flask,SQL and python', link: 'https://github.com/Littlebanbrick/diaries' },
];

function ProjectsPage() {
  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <h1 className="title is-3 mb-5">Projects</h1>

        <div className="columns is-multiline">
          {projects.map(project => (
            <div key={project.id} className="column is-6-tablet is-4-desktop">
              <a 
                href={project.link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <div className="card" style={{ height: '100%' }}>
                  <div className="card-content">
                    <p className="title is-5">{project.name}</p>
                    <p className="has-text-grey is-size-7">{project.desc}</p>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectsPage;