namespace HospitalSystem.Domain.Exceptions;

/// <summary>Base type for violations of business rules; the API layer maps this to HTTP 400.</summary>
public class DomainException(string message) : Exception(message);

public sealed class NotFoundException(string entityName, object key)
    : DomainException($"{entityName} with id '{key}' was not found.");

public sealed class SchedulingConflictException(string message) : DomainException(message);

public sealed class ForbiddenDomainException(string message) : DomainException(message);
