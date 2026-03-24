export function decideBootstrapActions(input) {
  const hasMembership = input.existingMemberships.length > 0;
  const hasWorkspace = Boolean(input.existingWorkspace);

  if (hasWorkspace && hasMembership) {
    return {
      createProfile: false,
      createWorkspace: false,
      createOwnerMembership: false,
      onboardingComplete: input.existingWorkspace?.onboardingStatus === "complete"
    };
  }

  return {
    createProfile: true,
    createWorkspace: !hasWorkspace,
    createOwnerMembership: !hasMembership,
    onboardingComplete: false
  };
}
