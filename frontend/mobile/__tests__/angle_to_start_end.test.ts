/**
 * CSS gradient angle → react-native-linear-gradient start/end vectors.
 *
 * Real, easy-to-get-wrong math (CSS: 0deg points "to top", clockwise;
 * LinearGradient: unit points where (0,0)=top-left, (1,1)=bottom-right),
 * used by every gradient surface — so it is unit-tested.
 */
import { angleToStartEnd } from '../src/presentation/components/atoms/app_linear_gradient/app_linear_gradient';

describe('angleToStartEnd', () => {
  it('0deg = "to top": bottom → top', () => {
    expect(angleToStartEnd(0)).toEqual({
      start: { x: 0.5, y: 1 },
      end: { x: 0.5, y: 0 },
    });
  });

  it('90deg = "to right": left → right', () => {
    expect(angleToStartEnd(90)).toEqual({
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
    });
  });

  it('180deg = "to bottom": top → bottom', () => {
    expect(angleToStartEnd(180)).toEqual({
      start: { x: 0.5, y: 0 },
      end: { x: 0.5, y: 1 },
    });
  });

  it('135deg (hero gradient) runs top-left → bottom-right, symmetric about centre', () => {
    const { start, end } = angleToStartEnd(135);
    expect(end.x).toBeGreaterThan(start.x);
    expect(end.y).toBeGreaterThan(start.y);
    expect(start.x + end.x).toBeCloseTo(1, 5);
    expect(start.y + end.y).toBeCloseTo(1, 5);
  });
});
