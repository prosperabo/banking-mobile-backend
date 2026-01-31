interface NameParts {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  second_last_name?: string | null;
}

export const buildFullName = ({
  first_name,
  middle_name,
  last_name,
  second_last_name,
}: NameParts): string => {
  return [first_name, middle_name, last_name, second_last_name]
    .filter(part => Boolean(part && part.trim()))
    .map(part => part!.trim())
    .join(' ');
};
