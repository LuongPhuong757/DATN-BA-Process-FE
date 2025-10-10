import React from 'react';
import ProjectList, { Project } from '../shared/ProjectList';

interface ProjectsScreenProps {
  onBackToUpload: () => void;
  onViewProject: (project: Project) => void;
}

const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  onBackToUpload,
  onViewProject
}) => {
  return (
    <ProjectList 
      onBackToUpload={onBackToUpload}
      onViewProject={onViewProject}
    />
  );
};

export default ProjectsScreen;
