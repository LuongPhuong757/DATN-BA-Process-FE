import React from 'react';
import TableView from '../shared/TableView';
import { Project } from '../shared/ProjectList';

interface ProjectDetailScreenProps {
  selectedProject: Project | null;
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  selectedProject
}) => {
  return (
    <div className="project-detail-container">
      {selectedProject && (
        <TableView 
          items={selectedProject.processedItems}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default ProjectDetailScreen;
