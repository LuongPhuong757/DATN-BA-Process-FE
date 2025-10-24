import React from 'react';
import ProjectList, { Project } from '../shared/ProjectList';
import './ProjectsScreen.css';

interface ProjectsScreenProps {
  onBackToUpload: () => void;
  onViewProject: (project: Project) => void;
}

const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  onBackToUpload,
  onViewProject
}) => {
  return (
    <div className="projects-screen-container">
      <ProjectList 
        onBackToUpload={onBackToUpload}
        onViewProject={onViewProject}
      />
    </div>
  );
};

export default ProjectsScreen;
