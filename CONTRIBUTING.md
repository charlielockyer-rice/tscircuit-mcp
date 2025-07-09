# Contributing to tscircuit-mcp

Thank you for your interest in contributing to tscircuit-mcp! This project provides a Model Context Protocol (MCP) server that enables Claude to interact with the tscircuit electronics component registry.

## Development Setup

### Prerequisites

- Bun 1.0.0 or higher (recommended)
- Alternatively, Node.js 18.0.0 or higher
- Claude Desktop (for testing)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/charlielockyer/tscircuit-mcp.git
   cd tscircuit-mcp
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Build the project**
   ```bash
   bun run build
   ```

4. **Run tests**
   ```bash
   bun test
   ```

### Development Workflow

1. **Start development server**
   ```bash
   bun run dev
   ```

2. **Type checking**
   ```bash
   bun run typecheck
   ```

3. **Manual testing**
   - Configure Claude Desktop with your development build
   - Test the MCP server integration
   - Use the provided test scenarios

## Project Structure

```
tscircuit-mcp/
├── src/
│   ├── index.ts           # Main entry point
│   ├── server.ts          # MCP server implementation
│   ├── tscircuit-api.ts   # Registry API client
│   └── types.ts           # TypeScript type definitions
├── build/                 # Compiled output
├── README.md              # Project documentation
├── CONTRIBUTING.md        # This file
└── package.json
```

## Code Style

- Use TypeScript with strict mode enabled
- Follow existing code patterns and naming conventions
- Add proper error handling for new features
- Include JSDoc comments for public APIs
- Use meaningful variable and function names

## Testing

- Write tests for new features and bug fixes
- Test both success and error scenarios
- Include integration tests where appropriate
- Ensure all tests pass before submitting

## Submitting Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test thoroughly**
   ```bash
   bun test
   bun run typecheck
   bun run build
   ```

4. **Commit your changes**
   ```bash
   git commit -m "Add feature: description of changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request**
   - Describe your changes clearly
   - Include any relevant issue numbers
   - Provide testing instructions

## Bug Reports

When reporting bugs, please include:
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (OS, Node/Bun version, Claude Desktop version)
- Any error messages or logs
- Minimal reproduction case if possible

## Feature Requests

For new features:
- Describe the use case and motivation
- Explain the expected behavior
- Consider backwards compatibility
- Discuss implementation approach if relevant

## Areas for Contribution

- **API enhancements**: Support for new tscircuit registry endpoints
- **Error handling**: More robust error recovery and user feedback
- **Performance**: Caching improvements and optimization
- **Documentation**: Better examples and use cases
- **Testing**: Expanded test coverage and integration tests
- **Logging**: Enhanced debugging and monitoring capabilities

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's technical standards

## Getting Help

- Check the README for setup instructions
- Review existing issues and pull requests
- Ask questions in issue discussions
- Reach out to maintainers for guidance

Thank you for contributing to tscircuit-mcp!