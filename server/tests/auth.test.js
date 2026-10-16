import request from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toBe(testUser.name);
      expect(res.body.email).toBe(testUser.email);
    });

    it('should prevent duplicate registration', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(testUser);
      // Duplicate registration
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/User already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login an existing user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      token = res.body.token;
    });

    it('should access protected endpoint with valid authentication', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email');
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should deny access to protected endpoint without authentication', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Not authorized/i);
    });
  });
  describe('PUT /api/auth/me (Protected Route)', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      token = res.body.token;
    });

    it('should update user profile with valid data', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          preferredStudyTime: 'morning',
          availableDailyHours: 4,
          preparationLevel: 'advanced',
          targetInformation: 'Exam in 2027',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.preferredStudyTime).toBe('morning');
      expect(res.body.availableDailyHours).toBe(4);
      expect(res.body.preparationLevel).toBe('advanced');
      expect(res.body.targetInformation).toBe('Exam in 2027');
    });

    it('should reject invalid data for profile update', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          availableDailyHours: 30, // Invalid: max 24
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Validation error/i);
    });

    it('should deny update without authentication', async () => {
      const res = await request(app).put('/api/auth/me').send({ name: 'Hack' });
      expect(res.statusCode).toEqual(401);
    });
  });
});
