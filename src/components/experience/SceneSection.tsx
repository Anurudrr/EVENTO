import React from 'react';

interface SceneSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export const SceneSection: React.FC<SceneSectionProps> = ({
  id,
  className = '',
  children,
}) => {
  return (
    <section id={id} className={`scene-section ${className}`.trim()}>
      {children}
    </section>
  );
};
