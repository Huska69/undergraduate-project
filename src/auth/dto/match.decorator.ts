import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function Match(property: string, options?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'Match',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedProperty] = args.constraints;
          const relatedValue = (args.object as any)[relatedProperty];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must match ${args.constraints[0]}`;
        },
      },
    });
  };
}