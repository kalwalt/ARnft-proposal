import { NFTEntity } from "app/model/NFTEntity";
import * as BABYLON from 'babylonjs';

export abstract class NFTRootBJS extends NFTEntity {

    private _hasFound: boolean = false;

    private interpolationFactor: number = 15;

    private _lastTranslation: BABYLON.Vector3;

    private _frameDrops: number = 0;

    private root: BABYLON.AbstractMesh;

    private _deltaAccuracy: number = 10;

    private trackedMatrix: any = {
        // for interpolation
        delta: [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ],
        interpolated: [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]
    }


    public update(): void {


        if (!this.world) {
            this._hasFound = false;
            this._frameDrops = 0;

            this.root.setEnabled(false);
        } else {
            let worldMatrix: BABYLON.Matrix = BABYLON.Matrix.FromArray(this.getArrayMatrix(this.world));

            if (!this._hasFound) {
                this.root.setEnabled(true);
                for (var i = 0; i < 16; i++) {
                    this.trackedMatrix.interpolated[i] = this.world[i];
                }
                this._hasFound = true;
                this._lastTranslation = worldMatrix.getTranslation();
            }
            else {
                let _currentTranslation: BABYLON.Vector3 = worldMatrix.getTranslation();

                if (Math.abs(BABYLON.Vector3.Distance(_currentTranslation, this._lastTranslation)) > this._deltaAccuracy) {
                    this._frameDrops += 1;
                    if (this._frameDrops > 3) {
                        this._lastTranslation = _currentTranslation;
                    }
                    return;
                }
                this._frameDrops = 0;
                this._lastTranslation = _currentTranslation;
                for (var i = 0; i < 16; i++) {
                    this.trackedMatrix.delta[i] = this.world[i] - this.trackedMatrix.interpolated[i];
                    this.trackedMatrix.interpolated[i] = this.trackedMatrix.interpolated[i] + (this.trackedMatrix.delta[i] / this.interpolationFactor);
                }
            }
            let matrix: BABYLON.Matrix = BABYLON.Matrix.FromArray(this.getArrayMatrix(this.trackedMatrix.interpolated));

            let rotMatrix: BABYLON.Matrix = matrix.getRotationMatrix();
            let rotation: BABYLON.Quaternion = new BABYLON.Quaternion().fromRotationMatrix(rotMatrix);
            this.root.rotation = rotation.toEulerAngles();

            let pos = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, 0), matrix);

            this.root.setAbsolutePosition(pos);
        }
    }
}