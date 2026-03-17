import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { Drips } from '@dripsprotocol/sdk';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Drips integration
let dripsClient;

async function initializeDrips() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID');
    dripsClient = new Drips(provider);
    console.log('Drips client initialized');
  } catch (error) {
    console.error('Failed to initialize Drips client:', error);
  }
}

// In-memory storage for projects and issues (in production, use a proper database)
const projects = new Map();
const issues = new Map();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Drips Project Manager API',
    version: '1.0.0',
    endpoints: {
      projects: '/api/projects',
      issues: '/api/issues',
      createProject: '/api/projects',
      createIssue: '/api/issues'
    }
  });
});

// Get all projects
app.get('/api/projects', (req, res) => {
  const projectList = Array.from(projects.values());
  res.json(projectList);
});

// Get project by ID
app.get('/api/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, repositoryUrl, maintainerAddress } = req.body;
    
    if (!name || !maintainerAddress) {
      return res.status(400).json({ error: 'Name and maintainer address are required' });
    }

    const projectId = uuidv4();
    const project = {
      id: projectId,
      name,
      description: description || '',
      repositoryUrl: repositoryUrl || '',
      maintainerAddress,
      createdAt: new Date().toISOString(),
      status: 'active',
      issues: []
    };

    projects.set(projectId, project);

    // If Drips client is available, set up streaming
    if (dripsClient) {
      try {
        await setupProjectDrips(projectId, maintainerAddress);
      } catch (dripsError) {
        console.warn('Failed to set up Drips streaming:', dripsError);
      }
    }

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get all issues
app.get('/api/issues', (req, res) => {
  const { projectId } = req.query;
  let issueList = Array.from(issues.values());
  
  if (projectId) {
    issueList = issueList.filter(issue => issue.projectId === projectId);
  }
  
  res.json(issueList);
});

// Get issue by ID
app.get('/api/issues/:id', (req, res) => {
  const issue = issues.get(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  res.json(issue);
});

// Create new issue
app.post('/api/issues', async (req, res) => {
  try {
    const { projectId, title, description, creatorAddress, bounty } = req.body;
    
    if (!projectId || !title || !creatorAddress) {
      return res.status(400).json({ error: 'Project ID, title, and creator address are required' });
    }

    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const issueId = uuidv4();
    const issue = {
      id: issueId,
      projectId,
      title,
      description: description || '',
      creatorAddress,
      bounty: bounty || 0,
      createdAt: new Date().toISOString(),
      status: 'open',
      assigneeAddress: null
    };

    issues.set(issueId, issue);
    project.issues.push(issueId);

    res.status(201).json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Update issue status
app.patch('/api/issues/:id/status', (req, res) => {
  try {
    const { status, assigneeAddress } = req.body;
    const issue = issues.get(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    issue.status = status || issue.status;
    if (assigneeAddress) {
      issue.assigneeAddress = assigneeAddress;
    }
    issue.updatedAt = new Date().toISOString();

    res.json(issue);
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Helper function to set up Drips streaming for a project
async function setupProjectDrips(projectId, maintainerAddress) {
  try {
    // This is a placeholder for Drips integration
    // In a real implementation, you would set up streaming from the maintainer to contributors
    console.log(`Setting up Drips streaming for project ${projectId} and maintainer ${maintainerAddress}`);
  } catch (error) {
    console.error('Error setting up Drips:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    projects: projects.size,
    issues: issues.size,
    dripsConnected: !!dripsClient
  });
});

// Initialize and start server
async function startServer() {
  await initializeDrips();
  
  app.listen(PORT, () => {
    console.log(`Drips Project Manager running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(console.error);
