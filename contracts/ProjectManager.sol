// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProjectManager is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _projectIds;
    Counters.Counter private _issueIds;
    
    struct Project {
        uint256 id;
        string name;
        string description;
        string repositoryUrl;
        address maintainer;
        uint256 createdAt;
        bool isActive;
    }
    
    struct Issue {
        uint256 id;
        uint256 projectId;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        IssueStatus status;
        uint256 bounty;
    }
    
    enum IssueStatus {
        Open,
        InProgress,
        Completed,
        Closed
    }
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Issue) public issues;
    mapping(uint256 => uint256[]) public projectIssues;
    mapping(address => uint256[]) public maintainerProjects;
    
    event ProjectCreated(
        uint256 indexed projectId,
        string name,
        string description,
        address indexed maintainer
    );
    
    event IssueCreated(
        uint256 indexed issueId,
        uint256 indexed projectId,
        string title,
        address indexed creator,
        uint256 bounty
    );
    
    event IssueStatusUpdated(
        uint256 indexed issueId,
        IssueStatus newStatus
    );
    
    modifier onlyMaintainer(uint256 _projectId) {
        require(
            projects[_projectId].maintainer == msg.sender,
            "Only project maintainer can perform this action"
        );
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(
            _projectId > 0 && _projectId <= _projectIds.current(),
            "Project does not exist"
        );
        require(projects[_projectId].isActive, "Project is not active");
        _;
    }
    
    modifier issueExists(uint256 _issueId) {
        require(
            _issueId > 0 && _issueId <= _issueIds.current(),
            "Issue does not exist"
        );
        _;
    }
    
    function createProject(
        string memory _name,
        string memory _description,
        string memory _repositoryUrl
    ) external returns (uint256) {
        _projectIds.increment();
        uint256 newProjectId = _projectIds.current();
        
        projects[newProjectId] = Project({
            id: newProjectId,
            name: _name,
            description: _description,
            repositoryUrl: _repositoryUrl,
            maintainer: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        maintainerProjects[msg.sender].push(newProjectId);
        
        emit ProjectCreated(newProjectId, _name, _description, msg.sender);
        return newProjectId;
    }
    
    function createIssue(
        uint256 _projectId,
        string memory _title,
        string memory _description,
        uint256 _bounty
    ) external projectExists(_projectId) nonReentrant returns (uint256) {
        _issueIds.increment();
        uint256 newIssueId = _issueIds.current();
        
        issues[newIssueId] = Issue({
            id: newIssueId,
            projectId: _projectId,
            title: _title,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            status: IssueStatus.Open,
            bounty: _bounty
        });
        
        projectIssues[_projectId].push(newIssueId);
        
        emit IssueCreated(newIssueId, _projectId, _title, msg.sender, _bounty);
        return newIssueId;
    }
    
    function updateIssueStatus(
        uint256 _issueId,
        IssueStatus _newStatus
    ) external issueExists(_issueId) onlyMaintainer(issues[_issueId].projectId) {
        issues[_issueId].status = _newStatus;
        emit IssueStatusUpdated(_issueId, _newStatus);
    }
    
    function getProject(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (Project memory) 
    {
        return projects[_projectId];
    }
    
    function getIssue(uint256 _issueId) 
        external 
        view 
        issueExists(_issueId) 
        returns (Issue memory) 
    {
        return issues[_issueId];
    }
    
    function getProjectIssues(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (uint256[] memory) 
    {
        return projectIssues[_projectId];
    }
    
    function getMaintainerProjects(address _maintainer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return maintainerProjects[_maintainer];
    }
    
    function getTotalProjects() external view returns (uint256) {
        return _projectIds.current();
    }
    
    function getTotalIssues() external view returns (uint256) {
        return _issueIds.current();
    }
}
