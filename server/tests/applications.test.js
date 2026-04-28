const request = require('supertest');
const app = require('../app');

let employerToken;
let jobseekerToken;
let jobId;
let applicationId;

beforeAll(async () => {
  // Create employer and a job
  const emp = await request(app).post('/api/auth/register').send({
    name: 'App Employer',
    email: 'app_employer@example.com',
    password: 'Password1',
    role: 'employer',
    company_name: 'AppCo',
  });
  employerToken = emp.body.token;

  const job = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${employerToken}`)
    .send({
      title: 'Application Test Role',
      location: 'Hyderabad',
      job_type: 'Full-time',
      category: 'IT',
      description: 'Testing applications flow',
      requirements: 'Jest experience',
      skills: 'javascript,jest,node',
      openings: 5,
    });
  jobId = job.body.id;

  // Create jobseeker
  const js = await request(app).post('/api/auth/register').send({
    name: 'App Seeker',
    email: 'app_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = js.body.token;
});

describe('POST /api/applications', () => {
  it('jobseeker can submit an application', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .field('job_id', String(jobId))
      .field('full_name', 'App Seeker')
      .field('email', 'app_seeker@example.com')
      .field('phone', '9876543210')
      .field('pincode', '500001')
      .field('experience_years', '2')
      .field('skills', 'javascript,jest');

    expect(res.status).toBe(201);
    expect(res.body.job_id).toBe(jobId);
    applicationId = res.body.id;
  });

  it('prevents duplicate application to the same job', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .field('job_id', String(jobId))
      .field('full_name', 'App Seeker')
      .field('email', 'app_seeker@example.com')
      .field('phone', '9876543210')
      .field('pincode', '500001');

    expect(res.status).toBe(409);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .field('job_id', String(jobId));

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent job', async () => {
    // Create a second jobseeker so they haven't applied to job 999999
    const js2 = await request(app).post('/api/auth/register').send({
      name: 'Seeker Two',
      email: 'seeker2@example.com',
      password: 'Password1',
      role: 'jobseeker',
    });
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${js2.body.token}`)
      .field('job_id', '999999')
      .field('full_name', 'Seeker Two')
      .field('email', 'seeker2@example.com')
      .field('phone', '9876543211')
      .field('pincode', '500002');

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/applications')
      .field('job_id', String(jobId));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/applications/my', () => {
  it('jobseeker sees their own applications', async () => {
    const res = await request(app)
      .get('/api/applications/my')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].job_title).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/applications/my');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/applications/job/:jobId', () => {
  it('employer sees applications for their job', async () => {
    const res = await request(app)
      .get(`/api/applications/job/${jobId}`)
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('jobseeker cannot view job applications', async () => {
    const res = await request(app)
      .get(`/api/applications/job/${jobId}`)
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 for job not owned by employer', async () => {
    const emp2 = await request(app).post('/api/auth/register').send({
      name: 'App Employer 2',
      email: 'app_emp2@example.com',
      password: 'Password1',
      role: 'employer',
      company_name: 'AnotherCo',
    });
    const res = await request(app)
      .get(`/api/applications/job/${jobId}`)
      .set('Authorization', `Bearer ${emp2.body.token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/applications/:id/status', () => {
  it('employer can update application status to shortlisted', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shortlisted');
  });

  it('employer can update application status to hired', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'hired' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('hired');
  });

  it('rejects invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'promoted' });
    expect(res.status).toBe(400);
  });

  it('jobseeker cannot update application status', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(403);
  });
});
