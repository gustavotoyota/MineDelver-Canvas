import { Vec3 } from 'src/code/misc/vec3';
import { Ref } from 'vue';

import { IEntity, onInput } from '../../../core/entities/entities';
import { Grid3 } from '../../../core/grid/grid3';
import { Input } from '../../../core/input';
import { ICellData } from '../../grid/cells';

export class Flagging implements IEntity {
  private _grid: Grid3<ICellData>;
  private _pointerWorldPos: Ref<Vec3 | undefined>;
  private _flagMode: Ref<boolean>;

  constructor(input: {
    grid: Grid3<ICellData>;
    pointerWorldPos: Ref<Vec3 | undefined>;
    flagMode: Ref<boolean>;
  }) {
    this._grid = input.grid;
    this._pointerWorldPos = input.pointerWorldPos;
    this._flagMode = input.flagMode;
  }

  setup(): void {
    onInput(() => {
      if (
        (!(this._flagMode.value && Input.pointerDown[0]) &&
          !Input.pointerDown[2]) ||
        this._pointerWorldPos.value === undefined
      ) {
        return;
      }

      const cell = this._grid.getCell(this._pointerWorldPos.value);

      if (!cell?.unrevealed) {
        return;
      }

      if (cell.flag) {
        delete cell.flag;
      } else {
        cell.flag = true;
      }

      return true;
    });
  }
}
