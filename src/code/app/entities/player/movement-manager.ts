import { ICellData } from 'src/code/app/grid/cells';
import { Grid3 } from 'src/code/core/grid/grid3';
import { Vec2 } from 'src/code/misc/vec2';
import { Vec3 } from 'src/code/misc/vec3';
import { Ref, ref } from 'vue';

import { onRender } from '../../../core/entities/entities';

export type PlayerWalkData =
  | {
      sourcePos: Vec3;
      targetPos: Vec3;
      targetIsObstacle: boolean;
      startTime: number;
      endTime: number;
    }
  | undefined;

export class PlayerMovementManager {
  private _walkDuration: Ref<number>;

  private _playerPos: Ref<Vec3>;

  private _grid: Grid3<ICellData>;
  private _currentTime: Ref<number>;

  private _loadCellCluster: (input: { startPos: Vec3 }) => boolean;
  private _movePlayer: (input: { targetPos: Vec3 }) => void;

  private _hp: Ref<number>;

  private _walkData: Ref<PlayerWalkData>;

  private _nextMovements: Vec2[] = [];

  constructor(input: {
    walkDuration: Ref<number>;
    playerPos: Ref<Vec3>;
    grid: Grid3<ICellData>;
    currentTime: Ref<number>;
    loadCellCluster: (input: { startPos: Vec3 }) => boolean;
    movePlayer: (input: { targetPos: Vec3 }) => void;
    hp: Ref<number>;
  }) {
    this._walkDuration = input.walkDuration;
    this._playerPos = input.playerPos;
    this._grid = input.grid;
    this._currentTime = input.currentTime;
    this._loadCellCluster = input.loadCellCluster;
    this._movePlayer = input.movePlayer;
    this._hp = input.hp;

    this._walkData = ref(undefined);
  }

  get data(): Ref<PlayerWalkData> {
    return this._walkData;
  }

  get isWalking(): boolean {
    return this._walkData.value !== undefined;
  }

  get progress(): number {
    if (this._walkData.value !== undefined) {
      return Math.min(
        1,
        (this._currentTime.value - this._walkData.value.startTime) /
          (this._walkData.value.endTime - this._walkData.value.startTime)
      );
    } else {
      return 0;
    }
  }

  get nextPlayerPos(): Vec3 {
    if (this._walkData.value !== undefined) {
      return this._walkData.value.targetPos;
    } else {
      return this._playerPos.value;
    }
  }

  get finalPlayerPos(): Vec3 {
    if (this._walkData.value !== undefined) {
      return this._playerPos.value.lerp(
        this._walkData.value.targetPos,
        this.progress
      );
    } else {
      return this._playerPos.value;
    }
  }

  cancelNextMovements() {
    this._nextMovements = [];
  }
  setNextMovements(movements: Vec2[]) {
    this._nextMovements = movements.toReversed();
  }

  walkToDirection(direction: Vec2) {
    this.walkTo(new Vec2(this.nextPlayerPos).add(direction));
  }

  get finalTargetPos(): Vec2 {
    if (this._nextMovements.length === 0) {
      return new Vec2(this._playerPos.value);
    } else {
      return this._nextMovements[0];
    }
  }

  private _tryNextMovement() {
    if (this._nextMovements.length === 0) {
      return;
    }

    if (this.isWalking) {
      return;
    }

    const targetPos = this._nextMovements.pop()!;

    if (targetPos.distChebyshev(this._playerPos.value) > 1) {
      this.cancelNextMovements();
      return;
    }

    this.walkTo(targetPos);
  }

  walkTo(targetPos: Vec2) {
    if (this.isWalking) {
      return;
    }

    const targetPos3 = targetPos.to3D(this._playerPos.value.z);

    if (targetPos.distChebyshev(this._playerPos.value) !== 1) {
      return;
    }

    const newCell = this._grid.getCell(targetPos3);

    if (newCell === undefined) {
      throw new Error('New cell is undefined');
    }

    if (newCell.flag) {
      return;
    }

    this._walkData.value = {
      sourcePos: new Vec3(this._playerPos.value),
      targetPos: new Vec3(targetPos3),
      targetIsObstacle: newCell.unrevealed || !!newCell.hasBomb,
      startTime: this._currentTime.value,
      endTime: this._currentTime.value + this._walkDuration.value,
    };
  }

  setup() {
    onRender(() => {
      this._tryNextMovement();
    });

    onRender(() => {
      if (
        this._walkData.value !== undefined &&
        this._currentTime.value >= this._walkData.value.endTime
      ) {
        const newCell = this._grid.getCell(this._walkData.value.targetPos);

        if (newCell === undefined) {
          throw new Error('New cell is undefined');
        }

        if (newCell.unrevealed || newCell.hasBomb) {
          if (
            !this._loadCellCluster({ startPos: this._walkData.value.targetPos })
          ) {
            this._hp.value = Math.max(0, this._hp.value - 1);
          }
        }

        this._movePlayer({ targetPos: this._walkData.value.targetPos });

        this._walkData.value = undefined;
      }
    });
  }
}
