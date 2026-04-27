import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('deve retornar ok=true', () => {
    const controller = new HealthController();
    expect(controller.check()).toEqual({ ok: true });
  });
});
