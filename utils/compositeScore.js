export const calculateCompositeScore = (profile = {}) => {
  const tenthPercentage = Number(profile.tenthPercentage ?? 0) || 0;
  const twelthPercentage = Number(profile.twelthPercentage ?? 0) || 0;
  const cgpa = Number(profile.cgpa ?? 0) || 0;
  const cocubesScore = Number(profile.cocubesScore ?? 0) || 0;

  const normalizedCgpa = cgpa > 10 ? cgpa : cgpa * 10;
  const score = (tenthPercentage + twelthPercentage + normalizedCgpa + cocubesScore) / 4;

  return Math.round(score * 100) / 100;
};

