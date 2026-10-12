# 背景テクスチャ

`sage-grain.png`: 現在使用している背景。添付された細かな粒子感のあるマットな画像を参考に、組み込みのimagegenツールでセージグリーンに調整した素材です。Figmaにも取り込めます。

滞在紹介セクションの全幅背景に使用しています。375px角で繰り返し、CSSで `#4f6757` を約65%重ねています。白い文字に合わせて緑の濃さを調整するためのレイヤーです。Figmaでサイトと同じ見た目にする場合も、画像の上にこの色を重ねてください。画像自体は生成結果をそのまま保存しています。

`washi-ivory.png`: 以前使用していた、黄みを抑えた生成り色の和紙素材。比較用として保存しています。

`washi-cream.png`: 添付された淡いクリーム色の紙の質感を参考に、最初に生成した素材。比較用として保存しています。

## 現在の粒子テクスチャのプロンプト

Edit the attached small square texture reference into a high-resolution background asset. Preserve its understated smooth matte surface and extremely fine, evenly distributed sandy grain. Recolor it to a soft desaturated sage green, average color approximately #7c8d80, compatible with sage #85958c and warm cream #f6f3eb on a Japanese hotel website. This green must have enough tonal depth for white serif text; use low saturation for a gentle pale-green feeling rather than a washed-out near-white green. Texture detail should be very subtle: tiny soft speckles, almost uniform color at normal viewing distance. Flat evenly lit edge-to-edge scan, no paper fibers, no cloud patterns, no large mottling, no folds, no shadows, no gradient or vignette, no borders, no lettering or objects. Make a seamless square texture suitable for repeating at 375px by 375px, with no change in density at its edges.

## 以前の和紙素材の色調整プロンプト

Edit the provided paper texture. Change ONLY its color palette, preserving the same delicate Japanese washi fibers, cloudy mottling, grain, flat uniformly lit composition, dimensions and edge-to-edge coverage. Replace the yellow-green cream cast with very pale neutral warm ivory / soft warm gray, average color close to #efeee7, gently compatible with a website using cream #f6f3eb, muted sage #85958c, and dark ink #303c35. Suppress yellow saturation strongly; no green, yellow, or brown streaks. Keep subtle low-contrast tonal variations and a quiet natural tactile texture. No text, objects, frames, shadows, vignette, or new details. This is a website background behind dark Japanese serif text.

## 最初の素材の生成プロンプト

Use case: photorealistic-natural. Asset type: subtle paper texture background for a full-width Japanese hotel website section. Generate only a flat, edge-to-edge scan of delicate Japanese washi paper. Extremely pale warm ivory cream with a faint yellow-green undertone, approximately #eae9d0. Very fine soft irregular paper fibers, understated cloudy mottling, and minute tactile grain evenly across the entire surface. Low contrast, quiet and elegant, suitable behind dark readable typography. Orthographic flat scan, uniformly lit, landscape 3:2 composition. No paper edges, folds, creases, shadows, vignette, lighting gradient, stains, drawings, shapes, symbols, lettering, objects, or frames. The texture should feel almost plain from a distance and softly fibrous up close. Keep density uniform at every edge so it can be used as a seamless repeating website background.
